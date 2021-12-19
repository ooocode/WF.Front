export const isSSR = typeof window === "undefined"
export const isDevelopment = (process.env.NODE_ENV === 'development')
export const isProduction = (process.env.NODE_ENV === 'production')

export const title = isProduction ? "广西壮族自治区市场监督管理局综合办公平台" : ''
//export const title = "广西壮族自治区市场监督管理局综合办公平台"

export const showLogo = isProduction
export const showMainLayout = 1 === 1; // process.env.NODE_ENV === 'development'
//export const showMainLayout = process.env.NODE_ENV === 'development'
export const mainLayoutEnableReflush = isProduction
export const mainLayoutLoadCountIntervalMS = 5000;


export const leftMenu_FaWen_Url = '/ArchPages/ArchTodo?proDefName=FWGL,Process_GWJS_FW&title=待办发文'
export const leftMenu_GWSXSP_url = '/ArchPages/ArchTodo?proDefName=GWSXSP&title=待办事项审批'
export const leftMenu_ShiWu_url = '/ArchPages/ArchTodo?proDefName=CCSP,QJGL,QJGL_GXJ,Process_DailySchedule&title=待办事务'

export const leftMenu_BGSSW_url = '/ArchPages/ArchTodo?proDefName=BGSSW&archType=&title=待办收文&title1='
export const leftMenu_BGSSW_Banjian_url = '/ArchPages/ArchTodo?proDefName=BGSSW&archType=办件&title=待办收文&title1=办件'
export const leftMenu_BGSSW_Yuejian_url = '/ArchPages/ArchTodo?proDefName=BGSSW&archType=阅件&title=待办收文&title1=阅件'

export const enableSSO = false

//在毫秒内用户没有任何操作，则整体自动刷新网页
export const idleAutoFlushMs = 60000

//工作流
let tempWorkFlowAPI: string = ''

if (process.env.NODE_ENV === 'development') {
  tempWorkFlowAPI = "http://192.168.1.3:8001"
  tempWorkFlowAPI = "http://172.26.130.105:81"
  //tempWorkFlowAPI = "http://172.26.130.243:81"
  //tempWorkFlowAPI = 'http://127.0.0.1:8500'
}

if (process.env.NODE_ENV === 'production') {
  //tempWorkFlowAPI = "http://172.16.130.105:81"
  if (!isSSR) {
    //tempWorkFlowAPI = window.location.origin
    tempWorkFlowAPI = "http://172.26.130.105:81"
    //tempWorkFlowAPI = "http://172.26.130.243:81"
    //tempWorkFlowAPI = window.location.origin
  }
}

export const workFlowBaseUrl = tempWorkFlowAPI

export class StringUtils {
  public static isNullOrEmpty(val: string | undefined | null): boolean {
    if (!val || val === undefined || val === null || val === '' || val?.trim() === '') {
      return true;
    }
    return false;
  };
}