import { User } from "./user.types";

export type LoginDto = {
  dni: string;
  password: string;
};



export type AuthResponse = {
  user: User;
  token: string;
};
