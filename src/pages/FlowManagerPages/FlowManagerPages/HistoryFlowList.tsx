import { Alert, Button, Descriptions, Form, Input, message, Modal, notification, Space, Tag } from "antd";
import Search from "antd/lib/input/Search";
import TextArea from "antd/lib/input/TextArea";
import Table, { ColumnsType, TablePaginationConfig } from "antd/lib/table";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAsync } from "react-use";
import { workFlowBaseUrl } from "../../../Commmon/consts";
import MainLayout from "../../../components/MainLayout";
import MainLayout1 from "../../../components/MainLayout";
import { axiosClient, fetchClient } from "../../../hooks/useApi";
import { useToggle } from "../../../hooks/useToggle";
import { messageBox } from "../../../messageBox";
import { DeleteProcessInstancceViewModel, HistoryFlowsClient, HistoryFlowViewModel, HistoryFlowViewModelTCollectionWithPagination, RuntimeFlowsClient, RuntimeFlowViewModelTCollectionWithPagination } from "../../../WorkFlowApi";

const historyFlowsClient = new HistoryFlowsClient(workFlowBaseUrl, { fetch: fetchClient })

interface IQueryParams {
    pageIndex: number
    pageSize: number
    businessKey?: string
}

export default () => {
    const [deleteDlgVisual, setDeleteDlgVisual] = useState(false)
    const [selectedProcess, setSelectedProcess] = useState<HistoryFlowViewModel>()
    const reloadFlowsState = useToggle()

    const { register, setValue, handleSubmit, control,
        formState: { errors }, getValues, watch } = useForm<IQueryParams>({
            defaultValues: {
                pageIndex: 1,
                pageSize: 10
            }
        })

    const list = useAsync(async () => {
        const value = getValues()
        const res = await historyFlowsClient.getList((value.pageIndex - 1) * value.pageSize,
            value.pageSize, value.businessKey)
        return res
    }, [reloadFlowsState.value])

    const handleTableChange = async (page: TablePaginationConfig) => {
        setValue('pageIndex', page.current ?? 1)
        reloadFlowsState.Toggle()
    }


    const deleteBtnClicked = (process: HistoryFlowViewModel) => {
        setSelectedProcess(process)
        //setValue('inputProcessId', '')
        setDeleteDlgVisual(true)
    }

    const updateCompleteState = (process: HistoryFlowViewModel) => {
        historyFlowsClient.updateState(process.id, "COMPLETED").then(res => {
            reloadFlowsState.Toggle()
        }).catch(err => messageBox(err))
    }

    const onSubmit = handleSubmit(data => {
        //var vm = new DeleteProcessInstancceViewModel()
        //vm.processInstanceId = data.inputProcessId
    })


    const columns: ColumnsType<HistoryFlowViewModel> = [
        {
            title: "??????Id",
            render: (e: HistoryFlowViewModel) => e.processInstanceId,
            width: 90
        },
        {
            title: "????????????",
            render: (e: HistoryFlowViewModel) => e.businessKey,
            width: 90
        },
        {
            title: "??????",
            render: (instance: HistoryFlowViewModel) => <label
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                {instance.title?.substr(0, 100)}
                {(instance?.title?.length ?? 0) > 100 ? '...' : ''}</label>,
            width: 200
        },
        {
            title: "??????",
            render: (e: HistoryFlowViewModel) => e.state === 'INTERNALLY_TERMINATED' ? <Button size='small' onClick={() => updateCompleteState(e)}>{e.state}</Button> : e.state,
            width: 90
        },
        {
            title: "????????????",
            render: (e: HistoryFlowViewModel) => e.deleteReason,
            width: 90
        },
        {
            title: "?????????",
            render: (e: HistoryFlowViewModel) => e.creatorDisplayName,
            width: 90
        }
        /*   {
              title: "??????",
              render: (e: HistoryFlowViewModel) => <Button size='small' danger onClick={() => deleteBtnClicked(e)}>??????</Button>,
              width: 50
          }, */
    ];

    const onSearchBusinessKey = (value: string) => {
        setValue('businessKey', value.trim());
        setValue('pageIndex',1)
        reloadFlowsState.Toggle()
    }

    return <div>
        <MainLayout>
            <Form layout='inline'>
                <Form.Item label="????????????">
                    <Search
                        onSearch={onSearchBusinessKey}
                        enterButton placeholder="" allowClear />
                </Form.Item>
            </Form>

            <Table
                columns={columns}
                rowKey={(record: HistoryFlowViewModel) => record.processInstanceId ?? ''}
                dataSource={list.value?.value}
                pagination={{ total: list.value?.total, pageSize: watch('pageSize'), current: watch('pageIndex') }}
                loading={list.loading}
                onChange={handleTableChange}
            />
        </MainLayout>

        <Modal
            title={`????????????????????????${selectedProcess?.processInstanceId}`}
            visible={deleteDlgVisual}
            onOk={onSubmit}
            onCancel={() => setDeleteDlgVisual(false)}
            okText="??????"
            cancelText="??????"
        >
            <Alert message="??????????????????????????????????????????" type="warning" />
            <Form layout='vertical'>
                {/*  <Form.Item label={`?????????${selectedProcess?.processInstanceId}???`} required>
                    <Controller
                        name='inputProcessId'
                        rules={{
                            required: { value: true, message: '????????????' },
                            validate: { message: (v) => (v === selectedProcess?.processInstanceId) ? undefined : '???????????????' }
                        }}
                        control={control} render={({ field }) => <Input {...field}></Input>}
                    />

                    {errors.inputProcessId && <span style={{ color: 'red' }}>{errors.inputProcessId.message}</span>}
                </Form.Item> */}
            </Form>
        </Modal>
    </div>
}