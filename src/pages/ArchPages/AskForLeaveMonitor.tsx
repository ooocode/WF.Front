import { Form, Space, Tag } from "antd";
import Search from "antd/lib/input/Search";
import { Button } from "antd/lib/radio";
import Table, { ColumnsType, TablePaginationConfig } from "antd/lib/table";
import { withPrefix } from "gatsby";
import React, { useEffect, useState } from "react";
import { workFlowBaseUrl } from "../../Commmon/consts";
import { lookTaskMode } from "../../Commmon/task";
import MainLayout from "../../components/MainLayout";
import MainLayout1 from "../../components/MainLayout";
import { askForLeaveClient } from "../../hooks/useApi";
import { AskForLeaveForm, AskForLeaveFormTCollectionWithPagination } from "../../WorkFlowApi";

export default function AskForLeaveMonitor() {
    const [items, setitems] = useState<AskForLeaveFormTCollectionWithPagination>()
    const [skip, setSkip] = useState(0)
    const [take, setTake] = useState(10)
    const [userDepartment, setUserDepartment] = useState('')
    const [userDisplayName, setUserDisplayName] = useState('')

    useEffect(() => {
        askForLeaveClient.get(skip, take, userDepartment, userDisplayName).then(res => {
            setitems(res)
        })

    }, [skip, take, userDepartment, userDisplayName])

    const handleTableChange = async (page: TablePaginationConfig) => {
        setSkip(((page.current ?? 1) - 1) * take)
    }


    /*const openTask = (form: BusinessForm | undefined) => {
        let mode: lookTaskMode = 'common'
        var href = `/FormPages/FlowForms/${form?.processDefKey}?form=${form?.processDefKey}&businessKey=${form?.businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }*/

    const columns: ColumnsType<AskForLeaveForm> = [
        {
            title: "部门",
            render: (task: AskForLeaveForm) => task.userDepartment?.replace('区市监局/', ''),
            width: 90
        },
        {
            title: "姓名",
            render: (task: AskForLeaveForm) => task.userDisplayName,
            width: 90
        },
        {
            title: "批次",
            render: (task: AskForLeaveForm) => <>第{task.batch}批</>,
            width: 90
        },
        {
            title: "公休假时间",
            render: (task: AskForLeaveForm) => <>{task.beginDateTime}至{task.endDateTime}</>,
            width: 200
        },
        {
            title: "天数",
            render: (task: AskForLeaveForm) => <>{task.days}</>,
            width: 90
        },
        {
            title: "事由",
            render: (instance: AskForLeaveForm) => <label
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                {instance.title?.substr(0, 100)}
                {(instance.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "去向",
            render: (instance: AskForLeaveForm) => <label
                style={{ wordBreak: "break-word" }}>
                {instance.address?.substr(0, 100)}
                {(instance.address?.length ?? 0) > 100 ? '...' : ''}</label>
        },

        /*   {
              title: "处室是否已确认",
              render: (instance: AskForLeaveForm) => instance.isDepartmentLeaderConfirm === true ? <Tag color='success'>已确认</Tag> : <Tag color='error'>未确认</Tag>,
              width: 100
          } */
    ];

    const exportData = () => {
        window.open(`${workFlowBaseUrl}/api/askForLeave/export`)
    }

    return <MainLayout>
        {/* <div>
            <Space>
                <Button>导出未确认名单（按部门）</Button>
                <Button>导出已经确认名单（按部门）</Button>
            </Space>
        </div> */}

        <Form layout='inline'>
            {/*    <Form.Item label="部门查询">
                <Search onSearch={e => setUserDepartment(e.trim())} enterButton placeholder="" allowClear />
            </Form.Item>

            <Form.Item label="姓名查询">
                <Search onSearch={e => setUserDisplayName(e.trim())} enterButton placeholder="" allowClear />
            </Form.Item> */}


            <Form.Item label="">
                <Button onClick={exportData}>导出数据</Button>
            </Form.Item>
        </Form>

        <hr />
        <Table
            columns={columns}
            rowKey={(record: AskForLeaveForm) => record.id ?? ''}
            dataSource={items?.value}
            pagination={{ total: items?.total, pageSize: take }}
            //loading={loading}
            onChange={handleTableChange}
        />

    </MainLayout>
}