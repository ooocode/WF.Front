import { Button, Form } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React from "react";
import { FormContext, useTask } from "../../../hooks/useTask";
import FormPage from "../../../components/FormPage";

export default () => {
    const formContext = useTask()
    return <FormContext.Provider value={formContext}>
        <FormPage>
            <div className="text-center">
                <h3 className="text-red"><b>系统问题反馈</b></h3>
                <div className="text-right">
                    <Button type="link">流程状态：<u>{formContext?.task?.value?.activityName}</u></Button>
                </div>
            </div>

            <div>
                <Form labelCol={{ span: 3 }}>
                    <Form.Item label="联系方式">
                        <TextArea autoSize
                            value={formContext?.watch('userInfo')}
                            onChange={e => formContext?.setValue('userInfo', e.target.value)}></TextArea>
                    </Form.Item>

                    <Form.Item label="标题">
                        <TextArea autoSize
                            value={formContext?.watch('title')}
                            onChange={e => formContext?.setValue('title', e.target.value)}></TextArea>
                    </Form.Item>

                    <Form.Item label="问题详细描述">
                        <TextArea autoSize={{ minRows: 5 }}
                            value={formContext?.watch('desc')}
                            onChange={e => formContext?.setValue('desc', e.target.value)}></TextArea>
                    </Form.Item>
                </Form>
            </div>
        </FormPage>
    </FormContext.Provider>
}