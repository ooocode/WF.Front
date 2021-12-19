import { Alert, Checkbox, Form, Select, Table, TablePaginationConfig, Tag } from "antd"
import React, { useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { processInstancesClient, useUser } from "../../hooks/useApi"
import { useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { BusinessForm, HistoryProcesseInstance } from "../../WorkFlowApi"
import MainLayout from "../../components/MainLayout"
import Search from "antd/lib/input/Search"
import { ColumnsType } from "antd/lib/table"
import { withPrefix } from "gatsby"
import { useAsync, useError, useTitle } from "react-use"
const { Option } = Select;

const processDefKeys: Map<string, string> = new Map<string, string>([
    ['', '全部流程'],
    ['GWSXSP', '公务事项审批'],
    ['CCSP', '出差审批'],
    ['QJGL', '请假管理'],
    ['FWGL', '发文管理'],
    ['BGSSW', '办公室收文'],
])

const ArchMonitor = () => {
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)
    const reloadTaskToggle = useToggle()
    const [search, setSearch] = useState<string>('')
    const [proDefKey, setProDefKey] = useState<string>('')
    const onlyShowFinishedFlows = useToggle();
    const drafterUserName = useStateEx('')
    const drafterName = useStateEx('')
    const onlyShowMeDrafter = useToggle()

    useTitle('公文监控')

    const { userName } = useUser()
    const archs = useAsync(async () => {
        let drafterUserNameValue = drafterUserName.value
        if (onlyShowMeDrafter.value === true) {
            drafterUserNameValue = userName ?? ''
        }

        let proDefKeys: string[] = []
        if (proDefKey.trim().length > 0) {
            proDefKeys = [proDefKey]
        } else {
            proDefKeys = ['GWSXSP', 'QJGL', 'CCSP']
        }

        const res = await processInstancesClient.getHistoryProcesseInstances((pageIndex - 1) * pageSize, pageSize, search,
            undefined, undefined, onlyShowFinishedFlows.value, drafterUserNameValue, drafterName.value, undefined,undefined, proDefKeys)
        return res
    }, [pageIndex, pageSize, reloadTaskToggle.value, proDefKey, search, onlyShowFinishedFlows.value, drafterUserName.value,
        drafterName.value, onlyShowMeDrafter.value, userName])



    const handleTableChange = async (page: TablePaginationConfig) => {
        setPageIndex(page.current ?? 1)
    }

    const StateTag = ({ state }: { state: string }) => {
        if (state === "COMPLETED") {
            return <Tag color="success">已完成</Tag>
        }

        return <Tag color="red">{state}</Tag>
    }

    const openTask = (form: BusinessForm | undefined) => {
        let mode: lookTaskMode = 'common'
        var href = `/FormPages/FlowForms/${form?.processDefKey}?form=${form?.processDefKey}&businessKey=${form?.businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }

    const columns: ColumnsType<HistoryProcesseInstance> = [
        {
            title: "紧急程度",
            render: (task: HistoryProcesseInstance) => (task.emergencyLevel?.length ?? 0) > 0 ? <span style={{ color: 'red' }}>{task.emergencyLevel}</span> : <></>,
            width: 90
        },
        {
            title: "标题",
            render: (instance: HistoryProcesseInstance) => <label onClick={() => openTask(instance.form)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{instance.form?.processDefName}】{instance.form?.title?.substr(0, 100)}
                {(instance.form?.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "来文单位",
            render: (instance: HistoryProcesseInstance) => instance?.form?.drafterDepartment?.split('/')?.reverse()[0],
            width: 90
        },

        {
            title: "文号",
            render: (instance: HistoryProcesseInstance) => instance.archNo,
            width: 90
        },
        {
            title: "流程状态",
            render: (instance: HistoryProcesseInstance) => <StateTag state={instance.state ?? ''}></StateTag>,
            width: 100
        },
        {
            title: "开始时间",
            render: (instance: HistoryProcesseInstance) => instance.startTime?.toLocaleDateString(),
            width: 100
        },
    ];

    return (<MainLayout>
        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>公文监控</Breadcrumb.Item>
        </Breadcrumb> */}

        {archs.error && <Alert
            message="Error"
            description={archs.error.message}
            type="error"
            showIcon
        />}

        <div>
            <Form layout='inline'>
                <Form.Item label="流程选择">
                    <Select value={proDefKey} style={{ width: 200 }} onChange={(e) => setProDefKey(e)}>
                        <Option value="">全部流程</Option>
                        <Option value="GWSXSP">公务事项审批</Option>
                        <Option value="CCSP">出差审批</Option>
                        <Option value="QJGL">请假管理</Option>
                        {/*   <Option value="FWGL">发文管理</Option>
                        <Option value="BGSSW">办公室收文</Option> */}
                    </Select>
                </Form.Item>

                <Form.Item label="标题查询">
                    <Search onSearch={e => setSearch(e.trim())} enterButton placeholder="" allowClear />
                </Form.Item>

                <Form.Item label="拟稿人查询">
                    <Search onSearch={e => drafterName.setValue(e.trim())} enterButton placeholder="" allowClear />
                </Form.Item>

                <Form.Item>
                    <Checkbox checked={onlyShowFinishedFlows.value} onChange={e => onlyShowFinishedFlows.Toggle()}>已完成的流程</Checkbox>
                </Form.Item>

                <Form.Item>
                    <Checkbox checked={onlyShowMeDrafter.value} onChange={e => onlyShowMeDrafter.Toggle()}>我起草的公文</Checkbox>
                </Form.Item>
            </Form>
        </div>

        <Table
            columns={columns}
            rowKey={(record: HistoryProcesseInstance) => record.id ?? ""}
            dataSource={archs.value?.rows}
            pagination={{ total: archs.value?.total, pageSize: pageSize }}
            loading={archs.loading}
            onChange={handleTableChange}
        />
    </MainLayout>
    )
}


export default ArchMonitor