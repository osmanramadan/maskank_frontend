import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export const fetchMessages = createAsyncThunk('messages/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/messages')).data.data; } catch (error) { return rejectWithValue(errorMessage(error, 'Unable to load messages')); }
});

export const sendInquiry = createAsyncThunk('messages/send', async (payload, { rejectWithValue }) => {
  try { return (await api.post('/messages', payload)).data.data; } catch (error) { return rejectWithValue(errorMessage(error, 'Unable to send inquiry')); }
});

export const markMessageRead = createAsyncThunk('messages/read', async (id, { rejectWithValue }) => {
  try { return (await api.put(`/messages/${id}/read`)).data.data; } catch (error) { return rejectWithValue(errorMessage(error, 'Unable to update message')); }
});

const messageSlice = createSlice({
  name: 'messages',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMessages.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchMessages.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(sendInquiry.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(markMessageRead.fulfilled, (state, action) => { const item = state.items.find((message) => message.id === action.payload.id); if (item) item.read_at = action.payload.read_at; });
  }
});

export default messageSlice.reducer;
