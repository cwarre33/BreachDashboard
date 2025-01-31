# Week 2: Frontend Scaffolding Roadmap

## Day 1: React Project Initialization and Setup
### Project Creation and Initial Configuration
- [ ] Create React project using Create React App
  ```bash
  npx create-react-app cybersecurity-dashboard
  cd cybersecurity-dashboard
  ```

- [ ] Install additional dependencies
  ```bash
  # Routing
  npm install react-router-dom

  # State Management
  npm install @reduxjs/toolkit react-redux

  # UI Component Library
  npm install @mui/material @emotion/react @emotion/styled

  # Leaflet for Maps
  npm install leaflet react-leaflet

  # Additional utilities
  npm install axios date-fns
  ```

### Project Structure Setup
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Footer.js
│   ├── map/
│   │   └── BreachMap.js
│   └── table/
│       └── BreachTable.js
├── pages/
│   ├── Dashboard.js
│   ├── BreachDetails.js
│   └── NotFound.js
├── redux/
│   ├── store.js
│   └── slices/
│       ├── breachSlice.js
│       └── authSlice.js
├── services/
│   ├── apiService.js
│   └── webSocketService.js
└── utils/
    ├── constants.js
    └── helpers.js
```

## Day 2: Routing and Basic Navigation
### React Router Configuration
- [ ] Set up main routing in `App.js`
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Import page components
import Dashboard from './pages/Dashboard';
import BreachDetails from './pages/BreachDetails';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/breach/:id" element={<BreachDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
```

## Day 3: State Management with Redux Toolkit
### Redux Store and Slices
- [ ] Create Redux store (`store.js`)
```javascript
import { configureStore } from '@reduxjs/toolkit';
import breachReducer from './slices/breachSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    breaches: breachReducer,
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    })
});
```

- [ ] Breach Slice Example
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../services/apiService';

export const fetchBreaches = createAsyncThunk(
  'breaches/fetchBreaches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getBreaches();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const breachSlice = createSlice({
  name: 'breaches',
  initialState: {
    data: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBreaches.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBreaches.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchBreaches.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default breachSlice.reducer;
```

## Day 4: Placeholder Components
### Map Component (BreachMap.js)
```jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BreachMap = ({ breaches }) => {
  return (
    <MapContainer 
      center={[0, 0]} 
      zoom={2} 
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {breaches.map(breach => (
        <Marker 
          key={breach.id} 
          position={[breach.location.latitude, breach.location.longitude]}
        >
          <Popup>
            {breach.type} - {breach.severity}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default BreachMap;
```

### Data Table Component (BreachTable.js)
```jsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper 
} from '@mui/material';

const BreachTable = ({ breaches }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {breaches.map((breach) => (
            <TableRow key={breach.id}>
              <TableCell>{breach.id}</TableCell>
              <TableCell>{breach.type}</TableCell>
              <TableCell>{breach.severity}</TableCell>
              <TableCell>
                {breach.location.city}, {breach.location.country}
              </TableCell>
              <TableCell>
                {new Date(breach.timestamp).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BreachTable;
```

## Day 5: Dashboard Integration
### Dashboard Page
```jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBreaches } from '../redux/slices/breachSlice';
import BreachMap from '../components/map/BreachMap';
import BreachTable from '../components/table/BreachTable';
import { Grid, Typography, Container } from '@mui/material';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data: breaches, status, error } = useSelector(state => state.breaches);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBreaches());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <Typography>Loading...</Typography>;
  if (status === 'failed') return <Typography>Error: {error}</Typography>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Cybersecurity Breach Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <BreachMap breaches={breaches} />
        </Grid>
        <Grid item xs={12} md={4}>
          <BreachTable breaches={breaches} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
```

## Weekend: Integration and Review
- [ ] Ensure all components work together
- [ ] Add basic error handling
- [ ] Perform initial code review
- [ ] Prepare documentation
- [ ] Plan for WebSocket integration in Week 3

## Potential Challenges and Mitigation
- State management complexity
  * Start with simple reducers
  * Incrementally add more complex logic
- Map rendering issues
  * Ensure correct Leaflet setup
  * Handle empty/null data gracefully
- Performance concerns
  * Implement lazy loading
  * Use memoization techniques

## Deliverables
- Fully configured React project
- Basic routing implemented
- Redux state management setup
- Placeholder map and data table components
- Initial dashboard layout
- Basic data fetching mechanism

## Recommended Tools
- VS Code or WebStorm
- React Developer Tools
- Redux DevTools
- Postman for API testing
