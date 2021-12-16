import { ReceivingUnitsClient } from './../../apis/GWExchange';
import {
  AttachmentsClient, FlowActivityAuthorizationsClient,
  FlowProcessInstancesClient,
  FormAttachmentsClient,
  OpinionTypesClient, ProcessDefsClient, ProcessDefsExClient, ProcessInstancesClient, QueryTasksClient, TasksClient, UserCustomOpinionsClient, UserReply, UsersClient, UserTaskClaimsClient, UserTasksClient
} from './../WorkFlowApi';
import { DepartmentsClient, UserGroupsClient, MessagesClient, AskForLeaveClient, DataStorageClient, KeyValueStorageClient } from './../WorkFlowApi';

import axios from 'axios'
import { Base64 } from 'js-base64';
import { InboxClient } from '../../apis/GWExchange';
import { StateStore, UserManager, WebStorageStateStore } from 'oidc-client';
import { navigate, withPrefix } from 'gatsby';
import localforage, { key } from 'localforage';
import { enableSSO, isSSR, workFlowBaseUrl } from '../Commmon/consts';
import { notificationError } from '../messageBox';
import { message, notification } from 'antd';
import { useAsync } from 'react-use';



const storage: StateStore = {
  set: (key: string, value: any) => {
    return Promise.resolve()
  },

  get: (key: string) => {
    return Promise.resolve(key)
  },

  remove: (key: string) => {
    return Promise.resolve(key)
  },

  getAllKeys: () => {
    return Promise.resolve([])
  }
}

export const redirect_uri = `${isSSR ? '' : window.location.origin}${withPrefix('/AccountPages/LoginCallback')}`
export const post_logout_redirect_uri = `${isSSR ? '' : window.location.origin}${withPrefix('/AccountPages/LoggedOut')}`
console.log('redirect_uri', redirect_uri)
console.log('post_logout_redirect_uri', post_logout_redirect_uri)

/*export const userManager = new UserManager({
  authority: workFlowBaseUrl,
  client_id: 'UserManagerSpa',
  response_type: 'code',
  redirect_uri: redirect_uri,
  post_logout_redirect_uri: post_logout_redirect_uri,
  stateStore: isSSR ? storage : new WebStorageStateStore({ store: window.localStorage }),
  userStore: isSSR ? storage : new WebStorageStateStore({ store: window.localStorage })
})

userManager.events.addAccessTokenExpired((ev) => {
  userManager.removeUser().then(res => {
    window.location.reload()
  }).catch(err => alert('发生错误'))
})
*/

//axios.defaults.timeout = 15000
export const axiosClient = axios.create()

axiosClient.interceptors.request.use(
  async config => {
    /* let user = await userManager.getUser()
     if (user == null) {
       message.error('未授权')
     } else {
       config.headers.Authorization = 'Bearer ' + user.access_token
     }*/

    /*let user = await getCurUser()
    if (user !== null) {
      config.headers.Authorization = "Basic " + Base64.encode(user.userName + ':' + user.name)
    } else {
      //message.error('未授权')
    }*/

    return config;
  },
  error => {
    return Promise.reject(error.response);
  });



const storeKey = 'oidc-user-info'

export const fetchClient = async (url: RequestInfo, init?: RequestInit) => {
  var header = init?.headers as HeadersInit as Record<string, string>

  //var auth = "Basic " + Base64.encode(user.userName + ':' + user.name)
  const userInfo = await localforage.getItem<IUserInfo>(storeKey)
  if (userInfo !== null) {
    header['Authorization'] = `Bearer ${userInfo.access_token}`
  }

  var res = await fetch(url, init)
  if (res.status === 401) {
    message.error('未登录')
    //await userManager.signinRedirect()
  }
  return res
}

export const usersClient = new UsersClient(workFlowBaseUrl, { fetch: fetchClient })
export const departmentsClient = new DepartmentsClient(workFlowBaseUrl, { fetch: fetchClient })
export const userGroupsClient = new UserGroupsClient(workFlowBaseUrl, { fetch: fetchClient })


export const attachmentsClient = new FormAttachmentsClient(workFlowBaseUrl, { fetch: fetchClient })
export const processDefsClient = new ProcessDefsClient(workFlowBaseUrl, { fetch: fetchClient })
export const processInstancesClient = new FlowProcessInstancesClient(workFlowBaseUrl, { fetch: fetchClient })
//export const tasksClient = new TasksClient(workFlowBaseUrl, { fetch: fetchClient })
export const tasksClient = new QueryTasksClient(workFlowBaseUrl, { fetch: fetchClient })

export const opinionTypesClient = new OpinionTypesClient(workFlowBaseUrl, { fetch: fetchClient })
export const userCustomOpinionsClient = new UserCustomOpinionsClient(workFlowBaseUrl, { fetch: fetchClient })

export const flowActivityAuthorizationsClient = new FlowActivityAuthorizationsClient(workFlowBaseUrl, { fetch: fetchClient })
export const messagesClient = new MessagesClient(workFlowBaseUrl, { fetch: fetchClient })
export const processDefsExClient = new ProcessDefsExClient(workFlowBaseUrl, { fetch: fetchClient })
export const askForLeaveClient = new AskForLeaveClient(workFlowBaseUrl, { fetch: fetchClient })

export const keyValueStorageClient = new KeyValueStorageClient(workFlowBaseUrl, { fetch: fetchClient })
export const dataStorageClient = new DataStorageClient(workFlowBaseUrl, { fetch: fetchClient })


//export const userTasksClient = new UserTasksClient(workFlowBaseUrl, { fetch: fetchClient })
export const userTasksClient = new UserTasksClient(workFlowBaseUrl, { fetch: fetchClient })
export const userTaskClaimsClient = new UserTaskClaimsClient(workFlowBaseUrl, { fetch: fetchClient })




//const GWExchangeBaseUrl = "http://localhost:8999"
const GWExchangeBaseUrl = "http://172.26.130.243:8999"
export const inboxClient = new InboxClient(GWExchangeBaseUrl, { fetch: fetchClient })
export const receivingUnitsClient = new ReceivingUnitsClient(GWExchangeBaseUrl, { fetch: fetchClient })


interface IUserInfo {
  access_token: string
  userName: string
  password: string
  userDisplayName?: string
  phoneNumber?: string
  mainDepartment?: string
}

export const useUser = () => {
  const state = useAsync(async () => {
    const res = await localforage.getItem<IUserInfo>(storeKey)
    return res
  }, [])

  const setLoginInfo = async (info: IUserInfo) => {
    await localforage.setItem(storeKey, info)
  }

  const removeLoginInfo = async () => {
    await localforage.removeItem(storeKey)
    if (enableSSO) {
      const href = `${workFlowBaseUrl}/connect/endsession?post_logout_redirect_uri=${post_logout_redirect_uri}`
      //const href = `${workFlowBaseUrl}/connect/authorize?client_id=client1&scope=openid email api1&response_type=token&redirect_uri=${redirect_uri}&state=abc&nonce=xyz`
      window.location.href = href
    }
  }

  return {
    userName: state.value?.userName,
    userDisplayName: state.value?.userDisplayName,
    password: state.value?.password,
    phoneNumber: state.value?.phoneNumber,
    mainDepartment: state.value?.mainDepartment,
    loading: state.loading,
    access_token: state.value?.access_token,
    bearer_access_token: 'Bearer ' + state.value?.access_token,
    setLoginInfo: setLoginInfo,
    removeLoginInfo: removeLoginInfo
  }
}

/*


// axios默认配置
axios.defaults.timeout = 10000;   // 超时时间
axios.defaults.baseURL = apiURL;  // 默认地址

//整理数据
axios.defaults.transformRequest = function (data) {
//data = Qs.stringify(data);
data = JSON.stringify(data);
  return data;
};

// 路由请求拦截
// http request 拦截器
axios.interceptors.request.use(
  config => {
    //config.data = JSON.stringify(config.data);
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    //判断是否存在ticket，如果存在的话，则每个http header都加上ticket
    if (cookie.get("token")) {
        //用户每次操作，都将cookie设置成2小时
        cookie.set("token",cookie.get("token") ,1/12)
        cookie.set("name",cookie.get("name") ,1/12)
     config.headers.token = cookie.get("token");
     config.headers.name= cookie.get("name");
    }

    return config;
  },
  error => {
    return Promise.reject(error.response);
  });

// 路由响应拦截
// http response 拦截器
axios.interceptors.response.use(
  response => {
    if (response.data.resultCode=="404") {
        console.log("response.data.resultCode是404")
        // 返回 错误代码-1 清除ticket信息并跳转到登录页面
//      cookie.del("ticket")
//      window.location.href='http://login.com'
        return
    }else{
        return response;
    }
  },
  error => {
    return Promise.reject(error.response)   // 返回接口返回的错误信息
  });
export default axios; */