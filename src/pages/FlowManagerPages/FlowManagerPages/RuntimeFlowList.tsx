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
            message.success('???????????????????????????')
            reloadFlowsState.Toggle()
            setDeleteDlgVisual(false)
        } catch (error) {
            notificationError('?????????????????????????????????', error)
        }
    })


    const columns: ColumnsType<RuntimeFlowViewModel> = [
        {
            title: "????????????",
            render: (e: RuntimeFlowViewModel) => e.businessKey,
            width: 90
        },
        {
            title: "??????",
            render: (instance: RuntimeFlowViewModel) => <label
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                {instance.title?.substr(0, 100)}
                {(instance?.title?.length ?? 0) > 100 ? '...' : ''}</label>,
            width: 200
        },
        {
            title: "??????????????????",
            render: (e: RuntimeFlowViewModel) => e.runtimeTasks?.map(task => <Descriptions key={task.taskId}>
                <Descriptions.Item>{task.procDefName}</Descriptions.Item>
                <Descriptions.Item label="?????????">{task.assigneeUserDisplayName}</Descriptions.Item>
                <Descriptions.Item label="??????">{task.taskName}</Descriptions.Item>
            </Descriptions>),
            width: 90
        },
        {
            title: "????????????",
            render: (e: RuntimeFlowViewModel) => <Button danger onClick={() => deleteBtnClicked(e)}>????????????</Button>,
            width: 50
        },
    ];

    return <div>
        <MainLayout>
            <Form layout='inline'>
                <Form.Item label="????????????">
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
            title={`????????????????????????${selectedProcess?.rootProcInstId}`}
            visible={deleteDlgVisual}
            onOk={onSubmit}
            onCancel={() => setDeleteDlgVisual(false)}
            okText="??????"
            cancelText="??????"
        >
            <Alert message="??????????????????????????????????????????????????????????????????????????????????????????????????????" type="warning" />
            <Form layout='vertical'>
                <Form.Item label={`?????????${selectedProcess?.rootProcInstId}???`} required>
                    <Controller
                        name='inputProcessId'
                        rules={{
                            required: { value: true, message: '????????????' },
                            validate: { message: (v) => (v === selectedProcess?.rootProcInstId) ? undefined : '???????????????' }
                        }}
                        control={control} render={({ field }) => <Input {...field}></Input>}
                    />

                    {errors.inputProcessId && <span style={{ color: 'red' }}>{errors.inputProcessId.message}</span>}
                </Form.Item>

                <Form.Item label={'??????????????????'}>
                    <Controller
                        name='deleteReason'
                        control={control} render={({ field }) => <TextArea {...field} />}
                    />
                </Form.Item>
            </Form>
        </Modal>
    </div>
}