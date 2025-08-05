// src/app/api/auth/authStore.ts
type User = {
  username: string;
  password: string;
};

let users: User[] = [];

export function addUser(user: User) {
  users.push(user);
}

export function findUser(username: string, password: string) {
  return users.find((u) => u.username === username && u.password === password);
}

export function getAllUsers() {
  return users;
}
