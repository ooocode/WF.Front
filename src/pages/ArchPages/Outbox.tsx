import { Breadcrumb, Select, Space, Tag } from "antd"
import React, { useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { processInstancesClient } from "../../hooks/useApi"
import { useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { ITodoTaskViewModel, BusinessForm, HistoryProcesseInstance } from "../../WorkFlowApi"
import { Link } from "gatsby"
import MainLayout from "../../components/MainLayout"
import Search from "antd/lib/input/Search"
import moment from "moment"
const { Option } = Select;

const Outbox = () => {
    const [instances, setInstances] = useState<HistoryProcesseInstance[]>([])
    const [loading, setLoding] = useState<boolean>(true)
    const [total, setTotal] = useState(0)
    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize] = useState(10)
    const reloadTaskToggle = useToggle()
    const [search, setSearch] = useState<string>('')
    const [proDefKey, setProDefKey] = useState<string>('')

    useEffect(() => {
        document.title = "公文监控"
        setLoding(true)
        /*  processInstancesClient.getHistoryProcesseInstances(pageIndex + 1, pageSize, proDefKey, search, undefined, undefined).then(res => {
             setTotal(res.total ?? 0)
             setInstances(res.rows ?? [])
         })
             .catch(err => messageBox(err))
             .finally(() => {
                 setLoding(false)
             }) */
    }, [pageIndex, pageSize, reloadTaskToggle.value, proDefKey, search])



    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        setPageIndex(page)
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
        window.open(href)
    }

    return (<MainLayout>
        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>公文监控</Breadcrumb.Item>
        </Breadcrumb> */}

        <div>
            <Space>
                <div>
                    <Select value={proDefKey} style={{ width: 200 }} onChange={(e) => setProDefKey(e)}>
                        <Option value="">全部流程</Option>
                        <Option value="GWSXSP">公务事项审批</Option>
                        <Option value="CCSP">出差审批</Option>
                        <Option value="FWGL">发文管理</Option>
                        <Option value="BGSSW">办公室收文</Option>
                    </Select>
                </div>
                <Search onSearch={setSearch} enterButton placeholder="标题查询" />
            </Space>
        </div>

        {/*   <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>

                            <TableCell style={{ width: 90 }}>紧急程度</TableCell>
                            <TableCell>标题</TableCell>
                            <TableCell style={{ width: 90 }}>来文单位</TableCell>
                            <TableCell style={{ width: 100 }}>文号</TableCell>
                            <TableCell style={{ width: 100 }}>剩余天数</TableCell>
                            <TableCell style={{ width: 100 }}>最新状态</TableCell>
                            <TableCell style={{ width: 140 }}>开始时间</TableCell>
                        </TableRow>
                    </TableHead>

                    {loading === false ? <TableBody>
                        {instances.map((instance) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={instance?.form?.id}>
                                    <TableCell>
                                        {''}
                                    </TableCell>
                                    <TableCell>
                                        {<label
                                            onClick={() => openTask(instance?.form)}
                                            style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer', fontSize: 14 }}>
                                            【{instance.form?.processDefName}】{instance.form?.title?.substr(0, 100)}
                                            {(instance.form?.title?.length ?? 0) > 100 ? '...' : ''}</label>}
                                    </TableCell>
                                    <TableCell>
                                        {instance?.form?.drafterDepartment?.split('/')?.reverse()[0]}
                                    </TableCell>
                                    <TableCell>
                                        {''}
                                    </TableCell>
                                    <TableCell>
                                        {''}
                                    </TableCell>
                                    <TableCell style={{ color: 'red' }}>
                                        <StateTag state={instance.state ?? ''}></StateTag>
                                    </TableCell>
                                    <TableCell>
                                        {instance.startTime?.toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody> : <></>}
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10]}
                component="div"
                count={total}
                rowsPerPage={pageSize}
                page={pageIndex}
                onChangePage={handleChangePage}
            />
        </Paper> */}
    </MainLayout>
    )
}





export default Outbox