import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchCurrentUser = createAsyncThunk('user/me', async (_, { rejectWithValue }) => {
  try { return (await api.get('/auth/me')).data.data.user; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Session expired'); }
});

const userSlice = createSlice({
  name: 'user',
  initialState: { profile: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.pending, (state) => { state.status = 'loading'; }).addCase(fetchCurrentUser.fulfilled, (state, action) => { state.status = 'succeeded'; state.profile = action.payload; }).addCase(fetchCurrentUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  }
});

export default userSlice.reducer;
