export const convertToCSV = (data, fields) => {
  if (!data || !data.length) return '';
  const header = fields.map(f => `"${f.label || f.key}"`).join(',');
  const rows = data.map(item => {
    return fields.map(f => {
      let val = item[f.key];
      if (typeof f.getter === 'function') {
        val = f.getter(item);
      }
      if (val === null || val === undefined) val = '';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',');
  });
  return [header, ...rows].join('\r\n');
};
