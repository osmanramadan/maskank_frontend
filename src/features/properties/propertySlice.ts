import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

type PropertyFilters = Record<string, string | number | boolean | undefined>;

export const fetchProperties = createAsyncThunk<any, PropertyFilters>('properties/fetchList', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/properties', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to load properties');
  }
});

export const fetchProperty = createAsyncThunk<any, string | undefined>('properties/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to load property');
  }
});

export const fetchMyProperties = createAsyncThunk<any[], void>('properties/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/properties/mine');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to load your properties');
  }
});

export const deleteProperty = createAsyncThunk<number, number>('properties/deleteOwnerProperty', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/properties/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to delete property');
  }
});

const initialState = { items: [], selected: null, ownerItems: [], pagination: null, status: 'idle', detailStatus: 'idle', error: null };

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: { clearSelectedProperty(state) { state.selected = null; state.detailStatus = 'idle'; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchProperties.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchProperties.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || 'Unable to load properties'; })
      .addCase(fetchProperty.pending, (state) => { state.detailStatus = 'loading'; state.error = null; })
      .addCase(fetchProperty.fulfilled, (state, action) => { state.detailStatus = 'succeeded'; state.selected = action.payload; })
      .addCase(fetchProperty.rejected, (state, action) => { state.detailStatus = 'failed'; state.error = action.payload || 'Unable to load property'; })
      .addCase(fetchMyProperties.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchMyProperties.fulfilled, (state, action) => { state.status = 'succeeded'; state.ownerItems = action.payload; })
      .addCase(fetchMyProperties.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || 'Unable to load your properties'; })
      .addCase(deleteProperty.fulfilled, (state, action) => { state.ownerItems = state.ownerItems.filter((property) => Number(property.id) !== Number(action.payload)); });
  }
});

export const { clearSelectedProperty } = propertySlice.actions;
export default propertySlice.reducer;
