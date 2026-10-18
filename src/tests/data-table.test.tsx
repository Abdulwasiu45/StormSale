import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  DataTable,
  AddressCell,
  TxHashCell,
  TableSkeleton,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "../components/ui/table";

interface TestSale {
  id: number;
  campaign: string;
  advertiser: string;
  txHash: string;
  amount: number;
  cleared: boolean;
}

const mockSalesData: TestSale[] = [
  {
    id: 1,
    campaign: "Alpha Campaign",
    advertiser: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    txHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    amount: 500,
    cleared: true,
  },
  {
    id: 2,
    campaign: "Beta Campaign",
    advertiser: "CA7QYNDQ3VKMGCDHS2GC5QWMSPYGSOROBANCONTRACTEXAMPLE1234567",
    txHash: "b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01",
    amount: 1200,
    cleared: false,
  },
  {
    id: 3,
    campaign: "Gamma Campaign",
    advertiser: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    txHash: "c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012",
    amount: 150,
    cleared: true,
  },
  {
    id: 4,
    campaign: "Alpha Campaign",
    advertiser: "GCIXQZ26A32F7LKM6P2VFXRMY6F7ZQQWXZKJ6RFLN6G43L6W47UFXZYA",
    txHash: "d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123",
    amount: 850,
    cleared: false,
  },
  {
    id: 5,
    campaign: "Delta Campaign",
    advertiser: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    txHash: "e5f67890123456789abcdef0123456789abcdef0123456789abcdef01234",
    amount: 300,
    cleared: true,
  },
];

const testColumns: ColumnDef<TestSale>[] = [
  {
    accessorKey: "id",
    header: "Sale ID",
    cell: ({ value }) => `#${String(value)}`,
    enableSorting: true,
  },
  {
    accessorKey: "campaign",
    header: "Campaign Name",
    enableSorting: true,
  },
  {
    accessorKey: "advertiser",
    header: "Advertiser Address",
    cell: ({ value }) => <AddressCell address={String(value)} truncateChars={4} />,
    enableSorting: false,
  },
  {
    accessorKey: "txHash",
    header: "Transaction Hash",
    cell: ({ value }) => <TxHashCell hash={String(value)} truncateChars={6} />,
    enableSorting: false,
  },
  {
    accessorKey: "amount",
    header: "Amount (XLM)",
    cell: ({ value }) => `${Number(value).toFixed(2)} XLM`,
    enableSorting: true,
  },
  {
    accessorKey: "cleared",
    header: "Status",
    cell: ({ value }) => (value ? "Cleared" : "Pending"),
    enableSorting: true,
  },
];

describe("DataTable Component Suite (#6)", () => {
  describe("Rendering & Baseline Behavior", () => {
    it("renders table headers and data rows correctly", () => {
      const html = renderToString(
        <DataTable columns={testColumns} data={mockSalesData} />,
      );

      expect(html).toContain("Sale ID");
      expect(html).toContain("Campaign Name");
      expect(html).toContain("Advertiser Address");
      expect(html).toContain("Transaction Hash");
      expect(html).toContain("Amount (XLM)");

      expect(html).toContain("Alpha Campaign");
      expect(html).toContain("Beta Campaign");
      expect(html).toContain("500.00 XLM");
      expect(html).toContain("1200.00 XLM");
    });

    it("displays custom emptyMessage when data is empty and not loading", () => {
      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={[]}
          emptyMessage="No sales recorded for this period."
        />,
      );

      expect(html).toContain("No sales recorded for this period.");
    });
  });

  describe("Multi-Column Sorting & Visual Indicators", () => {
    it("renders sortable headers with aria-sort and sort direction indicators", () => {
      const sorting: SortingState = [{ id: "campaign", desc: false, priority: 1 }];

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          sorting={sorting}
        />,
      );

      // campaign header should have aria-sort="ascending"
      expect(html).toContain('aria-sort="ascending"');
      // non-sorted sortable column should have aria-sort="none"
      expect(html).toContain('aria-sort="none"');
    });

    it("displays multi-column sort priority badges when multiple columns are sorted", () => {
      const multiSort: SortingState = [
        { id: "campaign", desc: false, priority: 1 },
        { id: "amount", desc: true, priority: 2 },
      ];

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          sorting={multiSort}
        />,
      );

      // Both columns should reflect their sort direction
      expect(html).toContain('aria-sort="ascending"');
      expect(html).toContain('aria-sort="descending"');

      // Priority numbers "1" and "2" should appear as badges in header
      expect(html).toContain(">1<");
      expect(html).toContain(">2<");
    });

    it("sorts rows client-side in primary and secondary order", () => {
      const multiSort: SortingState = [
        { id: "campaign", desc: false, priority: 1 },
        { id: "amount", desc: true, priority: 2 },
      ];

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          sorting={multiSort}
          enablePagination={false}
        />,
      );

      // For "Alpha Campaign", amount 850 should precede amount 500 because amount is descending
      const pos850 = html.indexOf("850.00 XLM");
      const pos500 = html.indexOf("500.00 XLM");
      expect(pos850).toBeGreaterThan(-1);
      expect(pos500).toBeGreaterThan(-1);
      expect(pos850).toBeLessThan(pos500);
    });

    it("supports custom sortingFn per column definition", () => {
      const customCol: ColumnDef<TestSale>[] = [
        {
          accessorKey: "campaign",
          header: "Campaign",
          enableSorting: true,
          sortingFn: (a, b) => b.campaign.localeCompare(a.campaign), // Reverse order
        },
      ];

      const html = renderToString(
        <DataTable
          columns={customCol}
          data={mockSalesData}
          sorting={[{ id: "campaign", desc: false }]}
          enablePagination={false}
        />,
      );

      const posGamma = html.indexOf("Gamma Campaign");
      const posAlpha = html.indexOf("Alpha Campaign");
      expect(posGamma).toBeLessThan(posAlpha);
    });

    it("supports manualSorting for server-side sorting delegations", () => {
      const onSortingChange = vi.fn();

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          manualSorting
          sorting={[{ id: "amount", desc: true }]}
          onSortingChange={onSortingChange}
        />,
      );

      // Renders with indicator without altering data order locally
      expect(html).toContain('aria-sort="descending"');
      // In mockSalesData, index 0 is Alpha (500)
      const firstRowIdx = html.indexOf("Alpha Campaign");
      const secondRowIdx = html.indexOf("Beta Campaign");
      expect(firstRowIdx).toBeLessThan(secondRowIdx);
    });
  });

  describe("Client-side & Server-side Pagination", () => {
    it("slices data client-side according to pageSize and pageIndex", () => {
      const pagination: PaginationState = { pageIndex: 0, pageSize: 2 };

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          pagination={pagination}
          pageSizeOptions={[2, 5, 10]}
        />,
      );

      // Page 1 should display 2 entries out of 5
      expect(html).toContain("Showing");
      expect(html).toContain(">1<");
      expect(html).toContain(">2<");
      expect(html).toContain(">5<");
      expect(html).toContain("Page 1 of 3");

      // First 2 campaigns rendered
      expect(html).toContain("Alpha Campaign");
      expect(html).toContain("Beta Campaign");
      // Gamma Campaign (index 2) should NOT be on page 1
      expect(html).not.toContain("Gamma Campaign");
    });

    it("handles server-side pagination with controlled totalRows and pageCount", () => {
      const serverPagination: PaginationState = { pageIndex: 2, pageSize: 10 };

      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          manualPagination
          totalRows={100}
          pageCount={10}
          pagination={serverPagination}
        />,
      );

      expect(html).toContain("Showing");
      expect(html).toContain(">21<");
      expect(html).toContain(">30<");
      expect(html).toContain(">100<");
      expect(html).toContain("Page 3 of 10");
    });
  });

  describe("Custom Cell Renderers (Addresses & Transaction Hashes)", () => {
    it("AddressCell truncates Stellar account addresses and provides copy/explorer links", () => {
      const stellarAccount = "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37";
      const html = renderToString(
        <AddressCell address={stellarAccount} truncateChars={4} network="testnet" />,
      );

      expect(html).toContain("GDQP...4W37");
      expect(html).toContain('title="GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"');
      expect(html).toContain('aria-label="Copy address"');
      expect(html).toContain('href="https://stellar.expert/explorer/testnet/account/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"');
      expect(html).toContain('target="_blank"');
    });

    it("AddressCell automatically links Soroban contracts to the contract explorer", () => {
      const sorobanContract = "CA7QYNDQ3VKMGCDHS2GC5QWMSPYGSOROBANCONTRACTEXAMPLE1234567";
      const html = renderToString(
        <AddressCell address={sorobanContract} truncateChars={4} network="testnet" />,
      );

      expect(html).toContain("CA7Q...4567");
      expect(html).toContain('href="https://stellar.expert/explorer/testnet/contract/CA7QYNDQ3VKMGCDHS2GC5QWMSPYGSOROBANCONTRACTEXAMPLE1234567"');
    });

    it("TxHashCell truncates hashes and provides copy and transaction explorer links", () => {
      const txHash = "e36e1e4985514dbdb96f3c22e4904a204a6462f59876543210abcdef12345678";
      const html = renderToString(
        <TxHashCell hash={txHash} truncateChars={6} network="testnet" />,
      );

      expect(html).toContain("e36e1e...5678");
      expect(html).toContain('title="e36e1e4985514dbdb96f3c22e4904a204a6462f59876543210abcdef12345678"');
      expect(html).toContain('aria-label="Copy transaction hash"');
      expect(html).toContain('href="https://stellar.expert/explorer/testnet/tx/e36e1e4985514dbdb96f3c22e4904a204a6462f59876543210abcdef12345678"');
    });

    it("handles null or empty address/hash gracefully", () => {
      const emptyAddrHtml = renderToString(<AddressCell address="" />);
      expect(emptyAddrHtml).toContain("—");

      const emptyHashHtml = renderToString(<TxHashCell hash="" />);
      expect(emptyHashHtml).toContain("—");
    });
  });

  describe("Integration with Skeleton Loaders for Async States", () => {
    it("renders animated skeleton rows when isLoading is true", () => {
      const html = renderToString(
        <DataTable
          columns={testColumns}
          data={mockSalesData}
          isLoading={true}
          skeletonRowCount={4}
        />,
      );

      // Table should be marked as aria-busy
      expect(html).toContain('aria-busy="true"');
      // Should render animate-pulse skeleton placeholders
      expect(html).toContain("animate-pulse");
      // Data rows should NOT be rendered while loading
      expect(html).not.toContain("Alpha Campaign");
    });

    it("TableSkeleton component can be rendered standalone", () => {
      const html = renderToString(
        <table>
          <tbody>
            <TableSkeleton columns={testColumns} rowCount={3} />
          </tbody>
        </table>,
      );

      expect(html).toContain("animate-pulse");
      // 3 rows rendered
      const rowMatches = html.match(/<tr/g);
      expect(rowMatches?.length).toBe(3);
    });
  });
});
