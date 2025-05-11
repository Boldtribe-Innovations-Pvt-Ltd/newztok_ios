import { applyMiddleware, compose, configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers/index';

const middleware = [
    thunk
]

export default configure = (initialState = {}) => {
    return configureStore(
        rootReducer,
        initialState,
        compose(applyMiddleware(...middleware)))
}
