import { Alert, Button, Descriptions, Form, Input, message, Modal, notification, Space, Tag } from "antd";
import Search from "antd/lib/input/Search";
import TextArea from "antd/lib/input/TextArea";
import Table, { ColumnsType, TablePaginationConfig } from "antd/lib/table";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { workFlowBaseUrl } from "../../../Commmon/consts";
import MainLayout from "../../../components/MainLayout";
import MainLayout1 from "../../../components/MainLayout";
import { axiosClient, fetchClient } from "../../../hooks/useApi";
import { useToggle } from "../../../hooks/useToggle";
import { messageBox, notificationError } from "../../../messageBox";
import { DeleteProcessInstancceViewModel, RuntimeFlowsClient, RuntimeFlowViewModel, RuntimeFlowViewModelTCollectionWithPagination } from "../../../WorkFlowApi";

const runtimeFlowsClient = new RuntimeFlowsClient(workFlowBaseUrl, { fetch: fetchClient })

interface IDeleteParams {
    inputProcessId: string
    deleteReason: string
}

export default () => {
    const [skip, setSkip] = useState(0)
    const [take, setTake] = useState(10)
    const [list, setList] = useState<RuntimeFlowViewModelTCollectionWithPagination>()
    const [loading, setLoding] = useState(true)
    const [businessKey, setBusinessKey] = useState('')
    const [deleteDlgVisual, setDeleteDlgVisual] = useState(false)
    const [selectedProcess, setSelectedProcess] = useState<RuntimeFlowViewModel>()
    const reloadFlowsState = useToggle()

    const { register, setValue, handleSubmit, control, formState: { errors } } = useForm<IDeleteParams>()

    useEffect(() => {
        setLoding(true)
        runtimeFlowsClient.getList(skip, take, businessKey).then(res => {
            setList(res)
        })
            .catch(err => messageBox(err))
            .finally(() => {
                setLoding(false)
            })
    }, [skip, take, businessKey, reloadFlowsState.value])

    const handleTableChange = async (page: TablePaginationConfig) => {
        setSkip(((page.current ?? 1) - 1) * take)
    }


    const deleteBtnClicked = (process: RuntimeFlowViewModel) => {
        setSelectedProcess(process)
        setValue('inputProcessId', '')
        setDeleteDlgVisual(true)
    }

    const onSubmit = handleSubmit(async data => {
        var vm = new DeleteProcessInstancceViewModel()
        vm.processInstanceId = data.inputProcessId
        vm.deleteReason = data.deleteReason
        try {
            await runtimeFlowsClient.deleteProcessInstancce(data.inputProcessId, vm)
            message.success('终止运行时流程成功')
            reloadFlowsState.Toggle()
            setDeleteDlgVisual(false)
        } catch (error) {
            notificationError('删除运行时历史流程出错', error)
        }
    })


    const columns: ColumnsType<RuntimeFlowViewModel> = [
        {
            title: "业务编号",
            render: (e: RuntimeFlowViewModel) => e.businessKey,
            width: 90
        },
        {
            title: "标题",
            render: (instance: RuntimeFlowViewModel) => <label
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                {instance.title?.substr(0, 100)}
                {(instance?.title?.length ?? 0) > 100 ? '...' : ''}</label>,
            width: 200
        },
        {
            title: "当前任务状态",
            render: (e: RuntimeFlowViewModel) => e.runtimeTasks?.map(task => <Descriptions key={task.taskId}>
                <Descriptions.Item>{task.procDefName}</Descriptions.Item>
                <Descriptions.Item label="签收人">{task.assigneeUserDisplayName}</Descriptions.Item>
                <Descriptions.Item label="状态">{task.taskName}</Descriptions.Item>
            </Descriptions>),
            width: 90
        },
        {
            title: "终止流程",
            render: (e: RuntimeFlowViewModel) => <Button danger onClick={() => deleteBtnClicked(e)}>终止流程</Button>,
            width: 50
        },
    ];

    return <div>
        <MainLayout>
            <Form layout='inline'>
                <Form.Item label="业务编号">
                    <Search
                        onSearch={e => setBusinessKey(e.trim())}
                        enterButton placeholder="" allowClear />
                </Form.Item>
            </Form>

            <Table
                columns={columns}
                rowKey={(record: RuntimeFlowViewModel) => record.rootProcInstId ?? ''}
                dataSource={list?.value}
                pagination={{ total: list?.total, pageSize: take }}
                loading={loading}
                onChange={handleTableChange}
            />
        </MainLayout>

        <Modal
            title={`确认终止处理实例${selectedProcess?.rootProcInstId}`}
            visible={deleteDlgVisual}
            onOk={onSubmit}
            onCancel={() => setDeleteDlgVisual(false)}
            okText="确认"
            cancelText="取消"
        >
            <Alert message="终止运行时处理实例将不能再恢复，但是不会删除历史流程记录，请谨慎操作" type="warning" />
            <Form layout='vertical'>
                <Form.Item label={`输入‘${selectedProcess?.rootProcInstId}’`} required>
                    <Controller
                        name='inputProcessId'
                        rules={{
                            required: { value: true, message: '不能为空' },
                            validate: { message: (v) => (v === selectedProcess?.rootProcInstId) ? undefined : '输入不一致' }
                        }}
                        control={control} render={({ field }) => <Input {...field}></Input>}
                    />

                    {errors.inputProcessId && <span style={{ color: 'red' }}>{errors.inputProcessId.message}</span>}
                </Form.Item>

                <Form.Item label={'终止流程原因'}>
                    <Controller
                        name='deleteReason'
                        control={control} render={({ field }) => <TextArea {...field} />}
                    />
                </Form.Item>
            </Form>
        </Modal>
    </div>
}