import { AUTH_STATUS } from "../types";

export default function(state = false, action) {
  // console.log(action.payload);
  switch (action.type) {
      case AUTH_STATUS:
        return action.payload;
      default : 
        return state
    }
  }
  