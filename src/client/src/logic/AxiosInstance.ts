import axios from 'axios'
import {v4 as uuid} from 'uuid';

const appInstanceId = uuid()

const AxiosInstance = axios.create({
  baseURL: '/api/',
  headers: {
    'x-instance-id': appInstanceId
  }
})

export default AxiosInstance
