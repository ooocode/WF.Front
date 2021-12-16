import { Button, Col, List, notification, Row, Table } from "antd"
import { ColumnsType } from "antd/lib/table"
import { withPrefix } from "gatsby"
import React, { useEffect, useState } from "react"
import { useAsync, useTitle } from "react-use"
import { lookTaskMode } from "../../Commmon/task"
import MainLayout from "../../components/MainLayout"
import { processDefsClient, processInstancesClient, tasksClient, usersClient, useUser } from "../../hooks/useApi"
import { useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { MobileTaskList, ProcessDefViewModel, StartProcessDefinitionViewModel } from "../../WorkFlowApi"

interface IFlow {
    processDefKey: string
    processDefName: string
}

const DraferArchCustom = () => {
    const reloadTasks = useToggle()

    useTitle('起草公文')

    const { userName, mainDepartment } = useUser()

    const flows = useAsync(async () => {
        let flows: IFlow[] = []

        if (mainDepartment === '区市监局/办公室' || userName === 'lhl' || userName === 'john') {
            flows.push({ processDefKey: 'BGSSW', processDefName: '办公室收文' })
        }

        flows.push({ processDefKey: 'FWGL', processDefName: '发文管理' })
        flows.push({ processDefKey: 'GWSXSP', processDefName: '公务事项审批' })
        flows.push({ processDefKey: 'CCSP', processDefName: '出差审批' })
        flows.push({ processDefKey: 'QJGL', processDefName: '请(休)假申请' })

        return flows
    }, [userName])


    const todoTasks = useAsync(async () => {
        if (userName) {
            const res = tasksClient.queryTodoTaskList(userName, 0, 20, true, undefined, undefined, [])
            return res
        }
    }, [reloadTasks.value, userName])

    const onItemClicked = async (item: IFlow) => {
        try {
            var newTab = window.open('about:blank');

            let vm = new StartProcessDefinitionViewModel()
            vm.processDefinitionKey = item.processDefKey

            var res = await processInstancesClient.startProcessDefinition(vm)
            notification.success({ message: '创建流程成功，正在打开表单' })

            let mode: lookTaskMode = 'todo'
            var href = `/FormPages/FlowForms/${item.processDefKey}?form=${item.processDefKey}&taskId=${res.taskId}&businessKey=${res.businessKey}&mode=${mode}`
            if (newTab != null) {
                newTab.location.href = withPrefix(href)
            }

            let handler = setInterval(() => {
                if (newTab?.closed) {
                    setTimeout(() => {
                        reloadTasks.Toggle()
                        clearInterval(handler)
                    }, 500);
                }
            }, 500)
        } catch (ex) {
            messageBox(ex)
        }
    }


    const getOpenArchHref = (task: MobileTaskList) => {
        const href = withPrefix(`FormPages/FlowForms/${task.processDefKey}/?form=${task.processDefKey}&taskId=${task.taskId}&businessKey=${task.businessKey}&mode=todo`)
        var newTab = window.open(href);

        let handler = setInterval(() => {
            if (newTab?.closed) {
                setTimeout(() => {
                    reloadTasks.Toggle()
                    clearInterval(handler)
                }, 500);
            }
        }, 500)
    }

    const deleteTaks = (task: MobileTaskList) => {
        if (task.processInstanceId) {
            processInstancesClient.deleteProcessInstancce(task.processInstanceId).then(res => {
                notification.success({ message: task.processDefName + '删除成功' })
                reloadTasks.Toggle()
            }).catch(err => messageBox(err))
        }
        else {
            notification.error({ message: '删除失败' })
        }
    }

    const deleteAll = () => {
        if (todoTasks.value?.rows && (todoTasks.value?.rows?.length ?? 0) > 0) {
            let arr: Promise<void>[] = []
            for (let index = 0; index < (todoTasks.value?.rows?.length ?? 0); index++) {
                const element = todoTasks.value.rows[index];
                arr.push(processInstancesClient.deleteProcessInstancce(element?.processInstanceId ?? ''))
            }

            Promise.all(arr).then(res => {
                notification.success({ message: '删除成功' })
                reloadTasks.Toggle()
            }).catch(err => notification.error({ message: JSON.stringify(err) }))
        }
    }

    const columns: ColumnsType<MobileTaskList> = [
        {
            title: '暂存的公文',
            render: (item: MobileTaskList) => <a onClick={() => getOpenArchHref(item)} target="_blank" rel="noopener noreferrer">
                [{item.processDefName}]{item.title}
            </a>
        },
        {
            title: '创建时间',
            render: (e: MobileTaskList) => e.createDateTime,
            width: 100
        },
        {
            title: '',
            render: (item: MobileTaskList) => <Button danger size='small' onClick={() => deleteTaks(item)}>删除</Button>
        },
    ]

    return (<MainLayout>
        <Row>
            <Col span={8}>
                <List
                    loading={flows.loading}
                    rowKey={item => item.processDefKey ?? ''}
                    itemLayout="horizontal"
                    dataSource={flows.value}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                /*   avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />} */
                                title={<Button onClick={() => onItemClicked(item)} type='link'>{item.processDefName ?? item.processDefKey}</Button>}
                                description=""
                            />
                        </List.Item>
                    )}
                />
            </Col>

            <Col span={16}>
                <Table dataSource={todoTasks.value?.rows} columns={columns} rowKey={item => item.taskId ?? ''} />
                {(todoTasks.value?.total ?? 0) > 0 && <Button danger onClick={deleteAll}>全部删除</Button>}
            </Col>
        </Row>
    </MainLayout>)
}

export default DraferArchCustom