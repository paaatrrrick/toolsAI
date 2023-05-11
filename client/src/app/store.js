import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counters/counterSlice'

export default configureStore({
    reducer: {
        counter: counterReducer
    },
})