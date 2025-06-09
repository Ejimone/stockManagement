import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'myAppAccessToken';
const REFRESH_TOKEN_KEY = 'myAppRefreshToken';
const USER_KEY = 'myAppUser';

export async function saveToken(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error saving token to SecureStore', error);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function getToken(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting token from SecureStore', error);
    return { accessToken: null, refreshToken: null }; // Return null on error
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from SecureStore', error);
    throw error;
  }
}

export async function saveUser(user: object): Promise<void> {
  try {
    const userString = JSON.stringify(user);
    await SecureStore.setItemAsync(USER_KEY, userString);
  } catch (error) {
    console.error('Error saving user to SecureStore', error);
    throw error;
  }
}

export async function getUser(): Promise<object | null> {
  try {
    const userString = await SecureStore.getItemAsync(USER_KEY);
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  } catch (error) {
    console.error('Error getting user from SecureStore', error);
    return null;
  }
}

export async function removeUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error removing user from SecureStore', error);
    throw error;
  }
}
