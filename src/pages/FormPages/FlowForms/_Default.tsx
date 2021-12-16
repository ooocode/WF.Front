import { Button, Form } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useContext } from "react";
import { FormContext, useTask } from "../../../hooks/useTask";
import FormPage from "../../../components/FormPage";

export default () => {
    const userTask = useTask()
    return <FormContext.Provider value={userTask}>
        <FormPage>
            <div className="text-center">
                <h3 className="text-red"><b>{userTask?.task?.value?.form?.processDefName}（默认表单模板）</b></h3>
                <div className="text-right">
                    <Button type="link">流程状态：<u>{userTask?.task?.value?.activityName}</u></Button>
                </div>
            </div>

            <div>
                <Form labelCol={{ span: 3 }}>
                    <Form.Item label="标题">
                        <TextArea autoSize
                            value={userTask?.watch('title')}
                            onChange={e => userTask?.setValue('title', e.target.value)}></TextArea>
                    </Form.Item>
                </Form>
            </div>
        </FormPage>
    </FormContext.Provider>
}