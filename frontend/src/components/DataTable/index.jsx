import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const DataTable = ({ rows = [], columns = [], loading = false }) => {
  // Ensure rows is always an array
  const safeRows = Array.isArray(rows) ? rows : [];
  
  // Add id field if missing
  const rowsWithId = safeRows.map((row, index) => ({
    id: row.id || row._id || index,
    ...row
  }));

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rowsWithId}
        columns={columns}
        loading={loading}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 20]}
        checkboxSelection={false}
        disableSelectionOnClick
        autoHeight
      />
    </Box>
  );
};

export default DataTable; 