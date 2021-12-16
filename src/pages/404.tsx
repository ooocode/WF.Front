import { Link } from 'gatsby'
import MainLayout from '../components/MainLayout'
import { Button, Form } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useContext } from "react";
import { FormContext, useTask } from "../hooks/useTask";
import FormPage from "../components/FormPage";
import { Router } from "@reach/router"
import ArchDone from './ArchPages/ArchDone';

export default () => {
    //const userTask = useTask()
    /*return <FormContext.Provider value={userTask}>
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
                            value={userTask?.fields.get('title')}
                            onChange={e => userTask?.SetField('title', e.target.value)}></TextArea>
                    </Form.Item>
                </Form>
            </div>
        </FormPage>
    </FormContext.Provider>*/

    return <MainLayout>
        <div>
            您要查找的资源不存在<br />
            <Link to='/'>回到首页</Link>
        </div>
    </MainLayout>
}