import { Form, Input } from "antd";
import React, { useContext } from "react";
import { StringUtils } from "../../../Commmon/consts";
import { lookTaskMode } from "../../../Commmon/task";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import FormPage from "../../../components/FormPage";
import { OpinionArea } from "../../../components/OpinionArea";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import { UserReply, FormDetailViewModel } from "../../../WorkFlowApi";

export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        console.log(user)
        if (task.canEditForm === true && task.isJustCreated) {
            if (StringUtils.isNullOrEmpty(formFields.get('tel'))) {
                formFields.set('tel', user?.name + ' ' + user?.phoneNumber)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('unit'))) {
                formFields.set('unit', user.mainDepatment?.split('/')?.reverse()[0] ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('title'))) {
                formFields.set('title', '请确认你部门、处室的集体公休假名单是否准确')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('opinion'))) {
                formFields.set('opinion', '请确认你部门、处室的集体公休假名单是否准确。如有错漏可联系人事处' + formFields.get('tel'))
            }
        }
    }

    const formContext = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })

    return <FormContext.Provider value={formContext}>
        <FormPage>
            <div className="text-center">
                <h3 className="text-red"><b>集体公休假名单确认</b></h3>

                <div className="text-right">
                    <label style={{ color: '#0000ee', fontSize: 16 }}>流程状态：<u>{formContext?.task?.value?.activityName}</u></label>
                </div>
            </div>

            {formContext.task?.value?.canEditForm === true && formContext.task.value?.isJustCreated === true ? <EditForm /> : <ReadOnlyForm />}
        </FormPage>
    </FormContext.Provider>
}

const ReadOnlyForm = () => {
    const context = useContext(FormContext)
    return <div>
        <Form>
            <Form.Item label="标题" required>
                <Input value={context?.watch('title')}></Input>
            </Form.Item>

            <Form.Item label="公休假名单" required>
                <FormAttachmentsPreviewBox></FormAttachmentsPreviewBox>
            </Form.Item>
        </Form>
    </div>
}

const EditForm = () => {
    const context = useContext(FormContext)
    return <div>
        <Form>
            {/*   <Form.Item label="人事处" required>
                <Input value={context?.fields.get('tel')} onChange={e => context?.SetField('tel', e.target.value.trim())}></Input>
            </Form.Item> */}


            <Form.Item label="标题" required>
                <Input value={context?.watch('title')} onChange={e => context?.setValue('title', e.target.value.trim())}></Input>
            </Form.Item>

            <Form.Item label="公休假名单" required>
                <FormAttachmentsPreviewBox></FormAttachmentsPreviewBox>
            </Form.Item>
        </Form>
    </div>
}