import { Link } from 'react-router-dom';

<Button
  component={Link}
  to={`/customers/${customer._id}/ledger`}
  variant="outlined"
  size="small"
>
  View Ledger
</Button> 