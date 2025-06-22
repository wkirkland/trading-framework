// components/table/DataTable.tsx
'use client';

import React, { useState, useMemo } from 'react';

export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (info: { getValue: () => any; row: { original: T } }) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  stickyHeader?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  stickyHeader = true,
  sortable = true,
  pagination = false,
  pageSize = 10,
  className = '',
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    columnId: null,
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(0);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.columnId || !sortState.direction) return data;

    const column = columns.find(col => col.id === sortState.columnId);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (column.accessorFn) {
        aVal = column.accessorFn(a);
        bVal = column.accessorFn(b);
      } else if (column.accessorKey) {
        aVal = a[column.accessorKey];
        bVal = b[column.accessorKey];
      } else {
        return 0;
      }

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortState.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortState.direction === 'asc' ? 1 : -1;

      // Convert to comparable values
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, columns, sortState]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSortState(prev => {
      if (prev.columnId === columnId) {
        // Cycle through: asc -> desc -> null
        switch (prev.direction) {
          case 'asc':
            return { columnId, direction: 'desc' };
          case 'desc':
            return { columnId: null, direction: null };
          default:
            return { columnId, direction: 'asc' };
        }
      } else {
        return { columnId, direction: 'asc' };
      }
    });
  };

  // Get cell value
  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (column.accessorFn) {
      return column.accessorFn(row);
    } else if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  };

  // Render cell content
  const renderCell = (row: T, column: TableColumn<T>) => {
    const value = getCellValue(row, column);
    
    if (column.cell) {
      return column.cell({
        getValue: () => value,
        row: { original: row }
      });
    }

    // Default cell rendering
    if (value == null) {
      return <span className="table-null-value">—</span>;
    }

    return String(value);
  };

  // Sort icon component
  const SortIcon = ({ columnId }: { columnId: string }) => {
    const isActive = sortState.columnId === columnId;
    const direction = isActive ? sortState.direction : null;

    return (
      <span className={`sort-icon ${isActive ? 'active' : ''}`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 2L8 4H4L6 2Z"
            fill="currentColor"
            className={direction === 'asc' ? 'active' : ''}
          />
          <path
            d="M6 10L4 8H8L6 10Z"
            fill="currentColor"
            className={direction === 'desc' ? 'active' : ''}
          />
        </svg>
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`data-table-container ${className}`}>
        <div className="data-table-loading">
          <div className="loading-spinner"></div>
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`data-table-container ${className}`}>
        <div className="data-table-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={`data-table-container ${className}`}>
        <div className="data-table-empty">
          <div className="empty-icon">📊</div>
          <h3>No data to display</h3>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-responsive ${className}`}>
      <div className={`data-table-wrapper ${stickyHeader ? 'sticky-header' : ''}`}>
        <table className="table-themed data-table">
          <thead className="data-table-head">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`
                    data-table-header
                    ${column.sortable && sortable ? 'sortable' : ''}
                    ${column.sticky ? 'sticky' : ''}
                    align-${column.align || 'left'}
                  `}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => column.sortable && sortable && handleSort(column.id)}
                >
                  <div className="header-content">
                    <span className="header-text">{column.header}</span>
                    {column.sortable && sortable && <SortIcon columnId={column.id} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="data-table-body">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  data-table-row
                  ${onRowClick ? 'clickable' : ''}
                  ${rowClassName ? rowClassName(row) : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`
                      data-table-cell
                      ${column.sticky ? 'sticky' : ''}
                      align-${column.align || 'left'}
                    `}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(0)}
            >
              First
            </button>
            <button
              className="pagination-button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            >
              Previous
            </button>
            <span className="pagination-current">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="pagination-button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            >
              Next
            </button>
            <button
              className="pagination-button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}