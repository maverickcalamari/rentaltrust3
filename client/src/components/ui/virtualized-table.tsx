import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column {
  key: string;
  header: string;
  width: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height: number;
  rowHeight?: number;
  className?: string;
}

export function VirtualizedTable({ 
  data, 
  columns, 
  height, 
  rowHeight = 60,
  className 
}: VirtualizedTableProps) {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = data[index];
    
    return (
      <div style={style} className="flex border-b border-gray-200 hover:bg-gray-50">
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-center px-4 py-2 text-sm"
            style={{ width: column.width, minWidth: column.width }}
          >
            {column.render ? column.render(row[column.key], row) : row[column.key]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          {columns.map((column) => (
            <div
              key={column.key}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-900"
              style={{ width: column.width, minWidth: column.width }}
            >
              {column.header}
            </div>
          ))}
        </div>
        
        {/* Virtualized Body */}
        <List
          height={height}
          itemCount={data.length}
          itemSize={rowHeight}
          width={totalWidth}
        >
          {Row}
        </List>
      </div>
    </div>
  );
}