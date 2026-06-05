type Dict = Record<string, string>;
const en: Dict = {
  dashboard_title: "Sankha's Assets Dashboard",
  total_assets: 'Total Assets',
  by_status: 'By Status',
  top_owners: 'Top Owners'
};

let current = en;
export function t(key: keyof typeof en): string { return current[key] || key; }
