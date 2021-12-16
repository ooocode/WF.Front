import { message, notification } from 'antd';
import { ApiException, ErrorModel, ProblemDetails } from './WorkFlowApi';
export const messageBox = (ex: any) => {
    console.log('原生错误', ex)
    if (typeof ex === "string") {
        message.success(ex);
    } else if (ApiException.isApiException(ex)) {
        let apiException = ex as ApiException
        let details: ProblemDetails = JSON.parse(JSON.stringify(ex.response))
        let desc = details.detail ?? ''
        if ((details as any).errors !== null && (details as any).errors !== undefined) {
            console.log('error', (details as any).errors)
            desc += JSON.stringify((details as any).errors)
        }


        notification.open({
            type: 'error',
            message: details.title,
            description: desc,
            duration: 10
        });
        console.log('api异常', apiException.response)
    }
    /*  else if (ex.isApiException === true) {
         let model: (ErrorResModel) = JSON.parse(JSON.stringify(ex.response))
         console.log(model)
         let desc = ''
         model.error?.details?.forEach(e => {
             desc += e.message;
             desc += '\n'
         })
 
         console.log(desc)
         notification.open({
             type: 'error',
             message: model.error?.message,
             description: desc,
             duration: 10
         });
     } */
    else if (ex instanceof Error) {
        let error: Error = ex as Error
        notification.open({
            type: 'error',
            message: error.name,
            description: error.message,
            duration: 10
        });
    }
    else {
        notification.open({
            type: 'error',
            message: '发生错误',
            description: JSON.stringify(ex),
            duration: 10
        });
    }
}


export function getErrorMessage(err: Error) {
    console.log(err)
    if (ApiException.isApiException(err)) {
        let apiException = err as ApiException
        console.log(apiException)
        let details: ProblemDetails = JSON.parse(JSON.stringify(apiException.response))
        let desc = details.detail ?? ''
        if ((details as any).errors !== null && (details as any).errors !== undefined) {
            console.log('error', (details as any).errors)
            desc += JSON.stringify((details as any).errors)
        }
        return desc
    } else {
        return err.message
    }
}



export function notificationError(message: string, error: unknown) {
    if (error instanceof ErrorModel) {
        notification.error({ message: message, description: error.error?.message })
    } else if (error instanceof Error) {
        notification.error({ message: message, description: error.message })
    }
}