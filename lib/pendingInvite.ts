import AsyncStorage from '@react-native-async-storage/async-storage';

// parks a join code from an invite link until the user is signed in
const storageKey = 'kyodoai.pendingJoinCode';

export async function savePendingInvite(code: string) {
  await AsyncStorage.setItem(storageKey, code);
}

// reads + clears in one step so a failed join doesn't loop forever
export async function takePendingInvite() {
  const code = await AsyncStorage.getItem(storageKey);
  if (code) await AsyncStorage.removeItem(storageKey);
  return code;
}

export async function clearPendingInvite() {
  await AsyncStorage.removeItem(storageKey);
}
