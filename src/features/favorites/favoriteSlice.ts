import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

function getError(error, fallback) { return error.response?.data?.message || fallback; }

export const fetchFavorites = createAsyncThunk('favorites/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/favorites')).data.data; } catch (error) { return rejectWithValue(getError(error, 'Unable to load favorites')); }
});

export const addFavorite = createAsyncThunk('favorites/add', async (propertyId, { rejectWithValue }) => {
  try {
    await api.post(`/favorites/${propertyId}`);
    return (await api.get('/favorites')).data.data;
  } catch (error) { return rejectWithValue(getError(error, 'Unable to save property')); }
});

export const removeFavorite = createAsyncThunk('favorites/remove', async (propertyId, { rejectWithValue }) => {
  try { await api.delete(`/favorites/${propertyId}`); return propertyId; } catch (error) { return rejectWithValue(getError(error, 'Unable to remove favorite')); }
});

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchFavorites.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(addFavorite.fulfilled, (state, action) => { state.items = action.payload; })
      .addCase(removeFavorite.fulfilled, (state, action) => { state.items = state.items.filter((item) => Number(item.id) !== Number(action.payload) && Number(item.property_id) !== Number(action.payload)); });
  }
});

export default favoriteSlice.reducer;
