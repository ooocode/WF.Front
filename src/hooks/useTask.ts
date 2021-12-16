import { CancelToken } from 'axios';
import { CompleteTaskViewModel, DisposeItem, ErrorModel, FieldItem, FormAttachmentDto, FormDetailViewModel, FormField, GetFormDetailMode, IDisposeItem, IFieldItem, IFormAttachmentDto, OpinionViewModel, ProblemDetails, TempSaveTaskViewModel, UserReply, UserTasksClient } from './../WorkFlowApi';
import { createContext, useEffect, useRef, useState } from "react"
import { attachmentsClient, processInstancesClient, tasksClient, fetchClient, usersClient, useUser } from './useApi';
import { messageBox, notificationError } from '../messageBox';
import { IGWSXSPFormFields } from '../FormModels/IGWSXSPFormFields'
import { IBUGFormFields } from '../FormModels/IBUGFormFields'
import { IBGSSWFormFields } from '../FormModels/IBGSSWFormFields'
import { IFWGLFormFields } from '../FormModels/IFWGLFormFields'
import { lookTaskMode } from '../Commmon/task'
import { IUseStateExResult, useStateEx, useToggle } from './useToggle';
import produce from 'immer';
import { ICCSPFields } from '../FormModels/ICCSPFields';
import { Base64 } from 'js-base64';
import { useQueryStringParser } from './useQueryStringParser';
import { useAsync } from 'react-use';
import { AsyncState } from 'react-use/lib/useAsync';
import { notification } from 'antd';
import { isDevelopment, StringUtils, workFlowBaseUrl } from '../Commmon/consts';
import { useFormQueryString } from './useFormQueryString';
import { Control, FieldValues, useFieldArray, useForm, UseFormHandleSubmit, UseFormSetValue, UseFormWatch } from 'react-hook-form';

/**
 * 表单key字段
 */
declare type FWGLFileds = '主办单位$$' | '拟稿人$$' | '联系电话$$'
declare type GWSXSPFileds = '主办单位1$$' | '拟稿人1$$' | '联系电话1$$'

//请假类型  请假去向
declare type Fields = 'qjlx' | 'qjqx' | '职务' | '职级' | '参加工作时间' | '休假年度' | '办理等级' | '是否抄送至办公厅限时系统'
declare type EmailSystemFields = 'EmailSender' | 'EmailAssignees' | 'EmailCC'


//接收单位 成文日期 反馈时间要求 签发人 印发日期 印发机关 份号
//反馈要求类别 是否上级部门来文 是否集中公休 集中公休时间段
declare type IGWJHFW = 'receivingUnits' | 'cwrq' | 'fksjyq'
    | 'leaderName' | 'yfrq' | 'yfjg' | 'fh'
    | 'fkyqlb' | 'sfsjbmlw' | 'sfjzgx' | 'jzgxsjd'


export declare type FormFieldKeyType = 'opinion' | keyof IGWSXSPFormFields | keyof IBUGFormFields | keyof IBGSSWFormFields | keyof IFWGLFormFields | keyof ICCSPFields
    | 'dispose1' | 'dispose2' | 'dispose3' | 'dispose4' | '是否同时发文转公文交换'
    | Fields | EmailSystemFields | IGWJHFW
    | string

export interface ICancel {
    value: boolean
}

export interface IUseTaskResult {
    task: AsyncState<FormDetailViewModel | undefined>
    attachments: AsyncState<FormAttachmentDto[]>
    opinions: AsyncState<OpinionViewModel[]>
    reloadTask: {
        value: boolean
        Toggle: () => void
    }

    reloadAttachments: {
        value: boolean
        Toggle: () => void
    }

    CompleteTask: (disposeItems: IDisposeItem[]) => void
    TempSaveTask: () => void
    selectUsersModalVisual: {
        value: boolean
        Toggle: () => void
    },

    //暂存按钮点击前
    onBeforeTempSave: React.MutableRefObject<(cancel: ICancel) => Promise<void>>

    //流程处理按钮被点击前
    onBeforeFlowProcessingBtnClicked: React.MutableRefObject<(cancel: ICancel) => Promise<void>>

    //处理中
    processing: boolean

    feedbackModalVisual: {
        value: boolean
        Toggle: () => void
    },

    cc: React.MutableRefObject<{ userNames: string[], taskName: string }>

    setValue: UseFormSetValue<FieldValues>
    control: Control<FieldValues, object>
    watch: UseFormWatch<FieldValues>
}

export const FormContext: React.Context<IUseTaskResult | undefined> = createContext<IUseTaskResult | undefined>(undefined);

export interface IUseTaskProps {
    onloadTaskSuccessAfter: (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => void
}


interface IKeyValue {
    key: FormFieldKeyType,
    value: string
}



export const useTask = (props?: IUseTaskProps): IUseTaskResult => {
    const { prodefKey, taskId, businessKey, mode } = useFormQueryString()

    const [user, setUser] = useState<UserReply | null>(null)

    const reloadAttachments = useToggle()
    const reloadTask = useToggle()
    const selectUsersModalVisual = useToggle()
    const processing = useStateEx<boolean>(false)
    const feedbackModalVisual = useToggle()

    const onBeforeTempSave = useRef<(cancel: ICancel) => Promise<void>>(() => Promise.resolve())
    const onBeforeFlowProcessingBtnClicked = useRef<(cancel: ICancel) => Promise<void>>(() => Promise.resolve())

    const cc =
        useRef<{ userNames: string[], taskName: string }>({ userNames: [], taskName: '' })

    const { userName, access_token } = useUser()



    const { setValue, handleSubmit, watch, control, reset, getValues, formState: { errors } } = useForm()

    //加载任务
    const task = useAsync(async () => {
        if (userName === undefined) {
            return
        }

        var user = await usersClient.getUserByUserName(userName)
        setUser(user)

        let enumMode: GetFormDetailMode = GetFormDetailMode._3;
        if (mode === 'todo') {
            enumMode = GetFormDetailMode._1
        } else if (mode === 'done') {
            enumMode = GetFormDetailMode._2
        } else if (mode === 'common') {
            enumMode = GetFormDetailMode._3
        }

        const res = await tasksClient.getTaskDetail(enumMode, taskId ?? '', businessKey ?? '')

        const fields = new Map<string, string>([])
        res.form?.fieldItems?.forEach(e => {
            var key = e.key as FormFieldKeyType
            fields.set(key, e.value ?? '')
        })

        fields.set('opinion', res.tempSaveOpinion ?? '')

        if (props?.onloadTaskSuccessAfter !== undefined) {
            props.onloadTaskSuccessAfter(user, res, fields, mode)
        }

        fields.forEach((value, key) => {
            setValue(key, value)
        })

        document.title = `${res.activityName} - ${res.form?.processDefName}` ?? '表单'

        return res
    }, [taskId, reloadTask.value, mode, userName, setValue])

    // 加载附件
    const attachments = useAsync(async () => {
        var onlyShowNullTagAttachments = false
        if (task.value?.activityName) {
            if (prodefKey === 'FWGL') {
                if (task.value?.activityName === '各单位收文' || task.value?.activityName == '相关人员阅' || mode === 'common') {
                    onlyShowNullTagAttachments = true
                }
            }
        }
        if (businessKey) {
            const res = await attachmentsClient.getFormAttachments(businessKey ?? '', taskId ?? '', false, onlyShowNullTagAttachments)
            return res
        }
    }, [businessKey, taskId, reloadAttachments.value, prodefKey, task.value?.activityName])


    //意见
    const opinions = useAsync(async () => {
        if (prodefKey && businessKey) {
            const res = await tasksClient.getFormOpinionsByBusinessKey(prodefKey ?? '', businessKey ?? '')
            return res
        }
    }, [prodefKey, businessKey])

    /**
     * 完成任务
     * @param dispose 
     * @param users 
     * @param targetActivityIsMultiInstance 
     */
    const CompleteTask = async (disposeItems: IDisposeItem[]) => {
        var value = getValues()
        console.log(value)

        if (prodefKey === 'FWGL' && StringUtils.isNullOrEmpty(value['mainSend'])) {
            notification.error({ message: '请输入主送单位' })
            return
        }

        if (prodefKey === 'FWGL' && StringUtils.isNullOrEmpty(value['tel'])) {
            if (task.value?.activityName === '拟稿人拟稿') {
                notification.error({ message: '请输入联系方式' })
                return
            }
        }

        if (prodefKey === 'FWGL' && StringUtils.isNullOrEmpty(value['unit'])) {
            if (task.value?.activityName === '拟稿人拟稿') {
                notification.error({ message: '请输入主办单位' })
                return
            }
        }

        if (prodefKey === 'FWGL' && StringUtils.isNullOrEmpty(value['name'])) {
            if (task.value?.activityName === '拟稿人拟稿') {
                notification.error({ message: '请输入拟稿人' })
                return
            }
        }

        processing.setValue(true);
        try {
            let vm = new CompleteTaskViewModel()
            vm.taskId = taskId ?? ''
            vm.opinion = value['opinion']
            vm.title = value['title']
            if (prodefKey === 'BGSSW') {
                vm.maxEndDateTime = value['endDate']
            } else if (prodefKey === 'FWGL') {
                vm.maxEndDateTime = value['endDate']
            } else if (prodefKey === 'GWSXSP') {
                vm.maxEndDateTime = value['date']
            }

            if (prodefKey === 'BGSSW') {
                if (cc.current.taskName === '局领导阅') {
                    vm.variables = {
                        "leaders": cc.current.userNames,
                        "ccleader": '同时抄送至局领导'
                    }
                } else {
                    vm.variables = {
                        "leaders": [],
                        "ccleader": '同时抄送至局领导'
                    }
                }
            }

            vm.formFields = []
            Object.keys(value).forEach(k => {
                var v = value[k]
                if (k !== 'opinion') {
                    vm.formFields?.push(FormField.fromJS({ key: k, value: v }))
                }
            });

            if (prodefKey === 'BGSSW') {
                vm.formFields.push(FormField.fromJS({ key: 'tag', value: value['archType'] }))
            }

            vm.disposeItems = disposeItems.map(e => DisposeItem.fromJS(e))

            const client = new UserTasksClient(workFlowBaseUrl, { fetch: fetchClient })
            await client.completeTask(vm)
            window.close()
        } catch (error) {
            notificationError('提交公文发生错误', error)
        } finally {
            processing.setValue(false)
        }
    }

    /**
     * 暂存任务
     */
    const TempSaveTask = () => {
        processing.setValue(true)
        let vm = new TempSaveTaskViewModel();
        vm.taskId = taskId ?? ''

        var value = getValues()

        vm.opinion = value['opinion']
        if (prodefKey === 'BGSSW') {
            vm.maxEndDateTime = value['endDate']
        } else if (prodefKey === 'FWGL') {
            vm.maxEndDateTime = value['endDate']
        } else if (prodefKey === 'GWSXSP') {
            vm.maxEndDateTime = value['date']
        }
        
        vm.formFields = []

        Object.keys(value).forEach(k => {
            var v = value[k]
            if (k !== 'opinion') {
                vm.formFields?.push(FormField.fromJS({ key: k, value: v }))
            }
        });

        tasksClient.tempSaveTask(taskId ?? '', vm).then(res => {
            messageBox('暂存成功')
            window.close()
        }).catch(error => notificationError('暂存公文发生错误', error))
            .finally(() => {
                processing.setValue(false)
            })
    }



    return {
        task: task,
        attachments: attachments,
        opinions: opinions,
        reloadTask,
        reloadAttachments,
        CompleteTask,
        TempSaveTask,
        selectUsersModalVisual,
        onBeforeTempSave: onBeforeTempSave,
        onBeforeFlowProcessingBtnClicked: onBeforeFlowProcessingBtnClicked,
        processing: processing.value,
        feedbackModalVisual: feedbackModalVisual,
        cc,
        setValue,
        watch,
        control
    }
}