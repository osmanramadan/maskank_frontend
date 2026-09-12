import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const adminRequest = (request: { type: string; call: (payload: Record<string, unknown>) => Promise<any> }) => createAsyncThunk<any, Record<string, unknown>>(request.type, async (payload = {}, { rejectWithValue }) => {
  try { return (await request.call(payload)).data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Admin request failed'); }
});

export const fetchAdminStats = createAsyncThunk('admin/stats', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/stats')).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to load dashboard'); }
});

export const fetchAdminProperties = adminRequest({ type: 'admin/properties', call: (params) => api.get('/admin/properties', { params }) });
export const fetchAdminUsers = adminRequest({ type: 'admin/users', call: (params) => api.get('/admin/users', { params }) });
export const fetchAdminReports = adminRequest({ type: 'admin/reports', call: (params) => api.get('/admin/reports', { params }) });

const adminSlice = createSlice({
  name: 'admin',
  initialState: { stats: null, properties: [], users: [], reports: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.status = 'succeeded'; state.stats = action.payload; })
      .addCase(fetchAdminStats.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchAdminProperties.fulfilled, (state, action) => { state.properties = action.payload.data; })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => { state.users = action.payload.data; })
      .addCase(fetchAdminReports.fulfilled, (state, action) => { state.reports = action.payload.data; });
  }
});

export default adminSlice.reducer;
