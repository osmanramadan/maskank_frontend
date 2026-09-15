import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const initialState = {
  token: localStorage.getItem('maskank_token'),
  user: null,
  status: 'idle'
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try { return (await api.post('/auth/login', credentials)).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to sign in'); }
});

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try { return (await api.post('/auth/register', details)).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to create account'); }
});

export const updateAccountRole = createAsyncThunk('auth/updateAccountRole', async (role, { rejectWithValue }) => {
  try { return (await api.patch('/auth/me/role', { role })).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to update account type'); }
});

export const updateAccountPhone = createAsyncThunk('auth/updateAccountPhone', async (phone: string, { rejectWithValue }) => {
  try { return (await api.patch('/auth/me/phone', { phone })).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to update phone number'); }
});

export const updateAccountName = createAsyncThunk('auth/updateAccountName', async (fullName: string, { rejectWithValue }) => {
  try { return (await api.patch('/auth/me/name', { fullName })).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to update your name'); }
});

export const updateAccountContactVisibility = createAsyncThunk(
  'auth/updateAccountContactVisibility',
  async ({ field, visible }: { field: 'email_public' | 'phone_public'; visible: boolean }, { rejectWithValue }) => {
    try {
      return (await api.patch('/auth/me/contact-visibility', { field, visible })).data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to update contact visibility');
    }
  }
);

export const uploadAccountAvatar = createAsyncThunk('auth/uploadAccountAvatar', async (file: File, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    return (await api.post('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to upload profile image'); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('maskank_token', action.payload.token);
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('maskank_token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; })
      .addCase(login.fulfilled, (state, action) => { state.status = 'succeeded'; state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('maskank_token', action.payload.token); })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.status = 'loading'; })
      .addCase(register.fulfilled, (state, action) => { state.status = 'succeeded'; state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('maskank_token', action.payload.token); })
      .addCase(register.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(updateAccountRole.pending, (state) => { state.status = 'loading'; })
      .addCase(updateAccountRole.fulfilled, (state, action) => { state.status = 'succeeded'; state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('maskank_token', action.payload.token); })
      .addCase(updateAccountRole.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(updateAccountPhone.pending, (state) => { state.status = 'loading'; })
      .addCase(updateAccountPhone.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload.user; })
      .addCase(updateAccountPhone.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(updateAccountName.pending, (state) => { state.status = 'loading'; })
      .addCase(updateAccountName.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload.user; })
      .addCase(updateAccountName.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(updateAccountContactVisibility.pending, (state) => { state.status = 'loading'; })
      .addCase(updateAccountContactVisibility.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload.user; })
      .addCase(updateAccountContactVisibility.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(uploadAccountAvatar.pending, (state) => { state.status = 'loading'; })
      .addCase(uploadAccountAvatar.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload.user; })
      .addCase(uploadAccountAvatar.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
