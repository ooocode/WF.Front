import { Button, Input, notification, RadioChangeEvent, Select, Space } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useEffect } from "react";
import { FormContext, FormFieldKeyType, IUseTaskResult, useTask } from "../../../hooks/useTask";
import { Radio } from 'antd';
import FormPage from "../../../components/FormPage";
import { FormDetailViewModel, TaskRedHatViewModel, UserReply } from "../../../WorkFlowApi";
import { lookTaskMode } from "../../../Commmon/task";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { useStateEx } from "../../../hooks/useToggle";
import { attachmentsClient, useUser } from "../../../hooks/useApi";
import { messageBox } from "../../../messageBox";
import { openFileByWps } from "../../../hooks/wps";
import { OpinionArea } from "../../../components/OpinionArea";
import { OpinionAreaFWGL } from "../../../components/OpinionAreaFWGL";
import { useFormQueryString } from "../../../hooks/useFormQueryString";
import { FieldValues, UseFormSetValue } from "react-hook-form";
import { StringUtils } from "../../../Commmon/consts";

const { Option } = Select;
interface IDealLevel {
    name: string
    days: number
}

const title = "广西壮族自治区市场监督管理局发文处理笺"
//const title = ""
/* const dealLevels: IDealLevel[] = [
    { name: '其他类型', days: 0 },
    { name: '特急件', days: 1 },
    { name: '加急件', days: 5 },
    { name: '普通一类', days: 12 },
    { name: '普通二类', days: 25 },
    { name: '普通三类', days: 110 },
    { name: '督办件', days: 999 }] */

const dealLevels: IDealLevel[] = [
    { name: '普通件', days: 5 },
    { name: '加急件', days: 3 },
    { name: '特急件', days: 1 },
    { name: '其他类型', days: 999 },
    //{ name: '普通二类', days: 25 },
    //{ name: '普通三类', days: 110 },
    //{ name: '督办件', days: 999 }
]

const fileTypes = ["空白正文"]
const redHeadFiles = ['空白正文', '局上报文', '局发文', '局函', '办公室发文', '办公室函',
    '局发文(电子版)', '办公室发文(电子版)'
    //, '党组发文',
    //'党组发文(电子版)', '党组函', '党组上报', '内部参阅', '桂微企办函', '桂微企办发', '办管脱钩',
    //'桂微企简报', '机关党委发文', '其他'
]

interface IPublicStyles {
    item: string
    reasons: string[]
}
const publicStyles: IPublicStyles[] = [
    {
        item: '此件不公开',
        reasons: [
            "其他不宜公开的信息",
            "危及国防、外交、国家主权和领土完整等事项的信息",
            "危及国家经济、金融利益的信息",
            "危及公共安全、社会稳定的信息",
            "依法确定为国家秘密的信息",
            "公开后可能不当损害第三方合法权益的信息，包括与商业秘密、个人隐私有关的各种涉及人身权、财产权的信息",
            "不成熟的过程性信息",
            "与行政机关履行外部职责没有直接关系的、纯属内部事务的信息",
        ]
    },
    {
        item: '此件公开发布',
        reasons: []
    },
    {
        item: '此件可依申请公开',
        reasons: [
            "其他宜依申请公开的信息",
            "涉及个别的公民、法人或其他组织，且法律法规并未规定必须公开的信息",
            "国家有关行业政策明确规定依申请公开的信息"
        ]
    },
]

const needPublicLookItems = ["不需要", "已审查"]

export default () => {
    const publicStyle = useStateEx<IPublicStyles | undefined>(undefined)
    const { userDisplayName, access_token } = useUser()
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (task.canEditForm === true && task.isJustCreated) {
            if (StringUtils.isNullOrEmpty(formFields.get('name'))) {
                formFields.set('name', user.name ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('unit'))) {
                formFields.set('unit', user.mainDepatment?.replace('区市监局/', '') ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('tel'))) {
                formFields.set('tel', user.phoneNumber ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('fileType'))) {
                formFields.set('fileType', fileTypes[0])
            }

            if (StringUtils.isNullOrEmpty(formFields.get('redHeadFile'))) {
                formFields.set('redHeadFile', redHeadFiles[0])
            }


            var nowDate = new Date().toLocaleDateString()
            if (StringUtils.isNullOrEmpty(formFields.get('date'))) {
                formFields.set('date', nowDate)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('sendDate'))) {
                formFields.set('sendDate', nowDate)
            }

            var nextDate = new Date(new Date().getTime() + 1 * (1000 * 60 * 60 * 24)).toLocaleDateString()
            if (StringUtils.isNullOrEmpty(formFields.get('beginDate'))) {
                formFields.set('beginDate', nowDate)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('endDate'))) {
                formFields.set('endDate', nextDate)
            }
        }
        if (StringUtils.isNullOrEmpty(formFields.get('emergencyLevel'))) {
            formFields.set('emergencyLevel', dealLevels[0].name)
        }

        let govPublicItem = formFields.get('govPublicItem')
        if (govPublicItem) {
            let selected = publicStyles.filter(e => e.item === govPublicItem)[0]
            publicStyle.setValue(selected)
            formFields.set('govPublicItemReason', selected.reasons[0])
        } else {
            publicStyle.setValue(publicStyles[0])
            formFields.set('govPublicItem', publicStyles[0].item)
            formFields.set('govPublicItemReason', publicStyles[0].reasons[0])
        }

        let archNo = formFields.get('archNo')
        if (StringUtils.isNullOrEmpty(archNo)) {
            formFields.set('archNo', `桂市监   〔${new Date().getFullYear()}〕   号`)
        }

        let needPublicLook = formFields.get('needPublicLook')
        if (StringUtils.isNullOrEmpty(needPublicLook)) {
            formFields.set('needPublicLook', needPublicLookItems[0])
        }
    }

    const { mode } = useFormQueryString()
    const formContext = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })

    const govPublicItemOnChange = (e: RadioChangeEvent) => {
        //if (formContext.task?.value?.canEditForm === true) {
        if (mode === 'todo') {
            let selected = publicStyles.filter(ee => ee.item === e.target.value)[0]
            publicStyle.setValue(selected)
            formContext.setValue('govPublicItemReason', selected.reasons[0])
            formContext.setValue('govPublicItem', selected.item)
        }
    }

    const dealLeveOnChange = (name: string) => {
        if (formContext.task?.value?.canEditForm === true) {
            formContext.setValue('emergencyLevel', name)
        }
    }

    useEffect(() => {
        let days = dealLevels.filter(e => e.name === formContext.watch('emergencyLevel'))[0]?.days?.toString() ?? '0'
        formContext.setValue('days', days)
    }, [formContext.watch('emergencyLevel')])

    useEffect(() => {
        let days = formContext.watch('days') ?? '0'
        formContext.setValue('endDate', new Date(new Date().getTime() + parseInt(days) * (1000 * 60 * 60 * 24)).toLocaleDateString())
    }, [formContext.watch('days')])

    const redHeadFileOnChange = (value: string) => {
        if (mode === 'todo' && formContext?.task.value?.activityName === '发文人员往各地市县发与各单位送') {
            var attachment = formContext.attachments.value?.filter(e => e.orignFileName === '正文.docx')[0]
            if (attachment) {
                let vm = new TaskRedHatViewModel()
                vm.fileName = attachment?.fileName
                vm.redHeatFileName = `${value}.doc`
                attachmentsClient.takeRedHeat(vm).then(res => {
                    formContext?.setValue('redHeadFile', value)
                    if (attachment) {
                        openFileByWps({
                            userName: userDisplayName ?? '',
                            access_token: access_token ?? '',
                            downloadUrl: attachment.downloadUrl ?? '',
                            uploadUrl: attachment.uploadUrl ?? '',
                            readonly: false
                        })
                    }
                }).catch(err => messageBox(err))
            } else {
                notification.error({ message: '不存在[正文.docx]文件' })
            }
        }
        else {
            notification.error({ message: '没有套红头权限，只有在发文人员往各地市县发与各单位送才能选择' })
        }
    }


    return <FormContext.Provider value={formContext}>
        <FormPage>
            {formContext.task?.value?.activityName === "相关人员阅" || formContext.task?.value?.activityName === "各单位收文" ? <SimpleForm formContext={formContext} /> : <div>
                <div>
                    <div className="text-right">
                        <label className="text-danger">办理等级：</label>
                        <Select
                            style={{ width: 100 }}
                            value={formContext.watch('emergencyLevel')}
                            onChange={dealLeveOnChange}>
                            {
                                dealLevels.map(e => {
                                    return <Option value={e.name} key={e.name}>{e.name}</Option>
                                })
                            }
                        </Select>
                    </div>

                    <div className="text-center">
                        <h3 className="text-red"><b>{title}</b></h3>
                        <Input className="text-red" style={{ border: 0, textAlign: 'center' }}
                            value={formContext.watch('archNo')}
                            onChange={e => formContext.setValue('archNo', e.target.value.trim())}></Input>

                        <h5><b> (非涉密公文专用)</b></h5>

                        <div className="text-right">
                            <label style={{ color: '#0000ee', fontSize: 16 }}>当前状态：
                                <u>
                                    {formContext?.task?.value?.activityName === "COMPLETED" ? "结束" : formContext?.task?.value?.activityName}
                                </u>
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <table className="table">
                        <tbody>
                            <tr className="text-danger">
                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input type='text'
                                            value={formContext?.watch('unit')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('unit', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>主办单位:</span>}
                                        />
                                    </Space>
                                </td>

                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input
                                            value={formContext?.watch('name')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('name', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>拟办人:</span>} />
                                    </Space>
                                </td>

                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input
                                            value={formContext?.watch('tel')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('tel', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>联系电话:</span>} />
                                    </Space>
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <label>&nbsp;&nbsp;文件类型:</label>
                                        <Select
                                            style={{ width: 100 }}
                                            value={formContext.watch('fileType')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext.setValue('fileType', e)}>
                                            {
                                                fileTypes.map(e => {
                                                    return <Option value={e} key={e}>{e}</Option>
                                                })
                                            }
                                        </Select>
                                    </Space>
                                </td>

                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input type='text'
                                            value={formContext.watch('date')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('date', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>拟办时间:</span>} />
                                    </Space>
                                </td>
                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input type='text'
                                            value={formContext?.watch('sendDate')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('sendDate', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>发文日期:</span>} />
                                    </Space>
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <label>&nbsp;&nbsp;红头文件:</label>
                                        <Select
                                            style={{ width: 180 }}
                                            value={formContext?.watch('redHeadFile')}
                                            onChange={redHeadFileOnChange}>
                                            {redHeadFiles.map(e => {
                                                return <Option value={e} key={e}>{e}</Option>
                                            })}
                                        </Select>
                                    </Space>
                                </td>

                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Space>
                                        <Input style={{ width: 170 }}
                                            value={formContext.watch('days')}
                                            onChange={e => formContext.task?.value?.canEditForm === true && formContext.watch('emergencyLevel') === '其他类型' && formContext.setValue('days', e.target.value)}
                                            size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                            bordered={formContext.task?.value?.canEditForm === true}
                                            addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>办结时间限制:</span>}
                                        />个工作日
                                    </Space>
                                </td>

                                <td style={{ width: "33.3%", borderTop: 'solid 0.5px red' }}>
                                    <Input type='text'
                                        value={formContext?.watch('endDate')}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext.watch('emergencyLevel') === '其他类型' && formContext.setValue('endDate', e.target.value)}
                                        size={formContext.task.value?.canEditForm === true ? undefined : 'large'}
                                        bordered={false}
                                        addonBefore={<span className='text-danger' style={{ fontSize: 16 }}>要求办结时间:</span>} />
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <label>公文标题：</label>
                                    {formContext.task?.value?.canEditForm === true ? <TextArea className="form-control"
                                        value={formContext?.watch('title')}
                                        onChange={e => formContext?.setValue('title', e.target.value)} /> : <label style={{ color: 'black' }}>
                                        {formContext?.watch('title')}</label>}
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <OpinionAreaFWGL />
                                </td>
                            </tr>


                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <label>主送：</label>
                                    {mode === 'todo' && (formContext.task.value?.activityName === '拟稿人拟稿' || formContext.task.value?.activityName === '拟稿人校对'
                                        || formContext.task.value?.activityName === '办公室核稿' || formContext.task.value?.activityName === '办公室主任核稿') ? <TextArea
                                        allowClear
                                        className="form-control"
                                        value={formContext?.watch('mainSend')}
                                        onChange={e => formContext?.setValue('mainSend', e.target.value)} /> : <label style={{ color: 'black' }}>
                                        {formContext?.watch('mainSend')}</label>}

                                    {/* {formContext.mode === 'todo' && formContext.task.value?.isJustCreated === true && <>
                                        <label>常用主送单位：</label>
                                    </>} */}
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <label>抄送：</label>
                                    {mode === 'todo' && (formContext.task.value?.activityName === '拟稿人拟稿' || formContext.task.value?.activityName === '拟稿人校对'
                                        || formContext.task.value?.activityName === '办公室核稿' || formContext.task.value?.activityName === '办公室主任核稿') ? <TextArea className="form-control"
                                            value={formContext?.watch('copySend')}
                                            onChange={e => formContext?.setValue('copySend', e.target.value)} /> : <label style={{ color: 'black' }}>
                                        {formContext?.watch('copySend')}</label>}
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <label>政府信息公开选项：</label>
                                    <Radio.Group
                                        value={publicStyle.value?.item}
                                        onChange={govPublicItemOnChange}
                                    >
                                        {publicStyles.map(e => {
                                            return <Radio value={e.item} key={e.item}>{e.item}</Radio>
                                        })}
                                    </Radio.Group>
                                    <br />
                                    {(publicStyle.value?.reasons.length ?? 0) > 0 ? <>
                                        <label>{publicStyle.value?.item}的理由选项：</label>
                                        <Select
                                            style={{ width: 750 }}
                                            value={formContext?.watch('govPublicItemReason')}
                                            onChange={e => mode === 'todo' && formContext?.setValue('govPublicItemReason', e)}>
                                            {publicStyle.value?.reasons.map(reason => {
                                                return <Option key={reason} value={reason}>{reason}</Option>
                                            })
                                            }
                                        </Select>
                                    </> : <></>}
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td colSpan={3}>
                                    <label>是否需要公平竞争审查：</label>
                                    <Select
                                        value={formContext?.watch('needPublicLook')}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('needPublicLook', e)}>
                                        {needPublicLookItems.map(item => {
                                            return <Option value={item} key={item}>{item}</Option>
                                        })}
                                    </Select>

                                    {formContext.task?.value?.canEditForm === true && formContext.watch('needPublicLook') === '需要' ? <>请下载公平性审查表，填写后上传到附件列表</> : <></>}
                                </td>
                            </tr>

                            <tr className="text-danger">
                                <td>
                                    <Space>
                                        <label>打字：</label>
                                        <Input
                                            value={formContext.watch('打字')}
                                            onChange={e => formContext.setValue('打字', e.target.value)}
                                            bordered={mode === 'todo' && (formContext.task.value?.activityName === '拟稿人拟稿' || formContext.task.value?.activityName === '拟稿人校对')}
                                        ></Input>
                                    </Space>
                                </td>

                                <td>
                                    <Space>
                                        <label>校对：</label>
                                        <Input
                                            value={formContext.watch('校对')}
                                            onChange={e => formContext.setValue('校对', e.target.value)}
                                            bordered={mode === 'todo' && (formContext.task.value?.activityName === '拟稿人拟稿' || formContext.task.value?.activityName === '拟稿人校对')}
                                        ></Input>
                                    </Space>
                                </td>

                                <td>
                                    <Space>
                                        <label>份数：</label>
                                        <Input
                                            value={formContext.watch('份数')}
                                            bordered={mode === 'todo' && (formContext.task.value?.activityName === '拟稿人拟稿' || formContext.task.value?.activityName === '拟稿人校对')}
                                            onChange={e => formContext.setValue('份数', e.target.value)}></Input>
                                    </Space>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>}
        </FormPage>
    </FormContext.Provider>
}


function SimpleForm({ formContext }: { formContext: IUseTaskResult }) {
    const { mode } = useFormQueryString()
    return <div>
        <div>
            <div className="text-right">
                <label className="text-danger">办理等级：</label>
                <label>{formContext.watch('emergencyLevel')}</label>
            </div>

            <div className="text-center">
                <h3 className="text-red"><b>{title}</b></h3>
                <h6 className="text-red">{formContext.watch('archNo')}</h6>
                <h6 className="text-red">{formContext.watch('title')}</h6>
                <h5><b> (非涉密公文专用)</b></h5>

                <div className="text-right">
                    <label style={{ color: '#0000ee', fontSize: 16 }}>当前状态：
                        <u>
                            {formContext?.task?.value?.activityName === "COMPLETED" ? "结束" : formContext?.task?.value?.activityName}
                        </u>
                    </label>
                </div>
            </div>

            <div className="form-group">
                <label className="text-danger">附件列表：</label>
                <div style={{ border: '1px solid black', padding: 5 }}>
                    <FormAttachmentsPreviewBox hideEditStatus={true} />
                </div>
            </div>


            {/*  {formContext.mode === 'todo' ? <div className="form-group">
                <label className="text-danger">处理意见(可选填)：</label>
                <textarea value={formContext.fields.get('opinion')}
                    onChange={e => formContext.SetField('opinion', e.target.value.trim())}
                    className="form-control"></textarea>
            </div> : <></>} */}

            {mode === 'todo' ? <div className="text-center">
                <Button onClick={() => { formContext.selectUsersModalVisual.Toggle() }} danger type='primary'>流程处理</Button>
            </div> : <></>}
        </div >
    </div>
}