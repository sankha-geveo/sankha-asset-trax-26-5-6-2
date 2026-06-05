import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SnackbarState = { message: string; type: 'success'|'error'|'info'|null } | null;

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState: null as SnackbarState,
  reducers: {
    show: (_, action: PayloadAction<SnackbarState>) => action.payload,
    clear: () => null
  }
});

export const { show: showSnackbar, clear: clearSnackbar } = snackbarSlice.actions;

export type AuthState = {
  connected: boolean;
  pubKey: string | null;
  assumedRole: 'ADMIN'|'USER'|'AUDITOR'|null; // user toggle for gating (backend doesn't expose a read role method)
};

const initialAuth: AuthState = { connected: false, pubKey: null, assumedRole: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setConnection: (state, action: PayloadAction<{ connected: boolean; pubKey: string | null }>) => {
      state.connected = action.payload.connected;
      state.pubKey = action.payload.pubKey;
    },
    setAssumedRole: (state, action: PayloadAction<AuthState['assumedRole']>) => { state.assumedRole = action.payload; }
  }
});

export const { setConnection, setAssumedRole } = authSlice.actions;

export const store = configureStore({
  reducer: {
    snackbar: snackbarSlice.reducer,
    auth: authSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
