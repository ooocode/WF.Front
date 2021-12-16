
import { Form, Input } from 'antd'
import React from 'react'
import { lookTaskMode } from '../../../Commmon/task'
import FormPage from '../../../components/FormPage'
import { FormContext, FormFieldKeyType, useTask } from '../../../hooks/useTask'
import { FormDetailViewModel, UserReply } from '../../../WorkFlowApi'

export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (task.canEditForm === true && task.isJustCreated) {

            if (formFields.get('name') === undefined) {
                formFields.set('name', user.name ?? '')
            }

            if (formFields.get('unit') === undefined) {
                formFields.set('unit', user.mainDepatment?.replace('区市监局/', '') ?? '')
            }

            if (formFields.get('personCounts') === undefined) {
                formFields.set('personCounts', '1')
            }
        }
    }

    const userTask = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })
    return <FormContext.Provider value={userTask}>
        <div>
            <div className="text-center">
                <h3 className="text-red"><b>邮件</b></h3>
                <div className="text-right">
                    <label style={{ color: '#0000ee', fontSize: 16 }}>流程状态：
                        <u>
                            {userTask?.task?.value?.activityName === "COMPLETED" ? "结束" : userTask?.task?.value?.activityName}
                        </u>
                    </label>
                </div>
            </div>

            <div>
                <Form>
                    <Form.Item label="收件人">
                        <Input value={userTask.watch('EmailAssignees')} onChange={e => userTask.setValue('EmailAssignees', e.target.value)}></Input>
                    </Form.Item>
                </Form>
            </div>
        </div >
    </FormContext.Provider>
}