import { Alert, Button, Form, Input, notification, Popconfirm, Space, Spin, Table, Tag } from "antd";
import TextArea from "antd/lib/input/TextArea";
import Modal from "antd/lib/modal/Modal";
import { ColumnsType } from "antd/lib/table";
import React, { useRef } from "react";
import { useAsync, useBoolean } from "react-use";
import { workFlowBaseUrl } from "../../../Commmon/consts";
import MyDialog from "../../../components/MyDialog";
import { axiosClient, fetchClient, tasksClient, useUser } from "../../../hooks/useApi";
import { useQueryStringParser } from "../../../hooks/useQueryStringParser";
import { useStateEx, useToggle } from "../../../hooks/useToggle";
import { messageBox } from "../../../messageBox";
import { OpinionItem, UpdateUserOpinionViewModel, UserOpinionsClient } from "../../../WorkFlowApi";
import "antd/dist/antd.css";


const client = new UserOpinionsClient(workFlowBaseUrl, { fetch: fetchClient })
export default () => {
    const query = useQueryStringParser()
    const processDefKey = query.get('processDefKey')
    const businessKey = query.get('businessKey')
    const visual = useToggle()
    const deleteDlgVisual = useToggle()


    const selectOpinionItem = useRef<OpinionItem | undefined>(undefined)
    const selectOpinionText = useStateEx('')
    const reload = useToggle()

    const { userName } = useUser()

    const opinions = useAsync(async () => {
        if (userName) {
            let myOpinions: OpinionItem[] = []
            const res = await tasksClient.getFormOpinionsByBusinessKey(processDefKey ?? '', businessKey ?? '')
            res.forEach(e => {
                e.opinionItems?.forEach(ee => {
                    if (ee.user?.userName == userName) {
                        myOpinions.push(ee)
                    }
                })
            })

            return myOpinions
        }
    }, [reload.value, userName])


    const columns: ColumnsType<OpinionItem> = [
        {
            title: "流程状态",
            render: (op: OpinionItem) => <Tag color='processing'>{op.opinion?.activityName}</Tag>,
            width: 200
        },
        {
            title: "意见",
            render: (op: OpinionItem) => op.opinion?.text
        },
        {
            title: "时间",
            render: (op: OpinionItem) => op.formatDateTime,
            width: 200
        },
        {
            title: "操作",
            render: (op: OpinionItem) => <Space>
                <Button onClick={() => onClickEdit(op)}>修改</Button>
                <Button onClick={() => { selectOpinionItem.current = op; deleteDlgVisual.Toggle() }} danger>删除</Button>
            </Space>,
            width: 80
        },
    ];

    const onClickEdit = (record: OpinionItem) => {
        selectOpinionItem.current = record
        selectOpinionText.setValue(record.opinion?.text ?? '')
        visual.Toggle()
    }

    const onUpdateClick = () => {
        if (selectOpinionItem.current?.opinion?.id) {
            if (selectOpinionText.value.trim().length === 0) {
                notification.error({ message: '意见不能为空' })
                return
            }

            let vm = new UpdateUserOpinionViewModel()
            vm.userName = selectOpinionItem.current.user?.userName
            vm.newOpinionText = selectOpinionText.value.trim()
            vm.remark = ''

            client.updateUserOpinion(selectOpinionItem.current?.stringId ?? '', vm).then(res => {
                reload.Toggle()
                notification.success({ message: '修改意见成功' })
            }).catch(err => messageBox(err))
        }
    }

    const onClickDelete = () => {
        if (selectOpinionItem.current?.opinion?.id) {
            client.deleteUserOpinion(selectOpinionItem.current.stringId ?? '',
                selectOpinionItem.current.opinion.userName).then(res => {
                    reload.Toggle()
                    deleteDlgVisual.Toggle()
                    notification.success({ message: "删除成功" })
                }).catch(err => messageBox(err))
        }
    }

    return <>
        <Table
            columns={columns}
            rowKey={(record: OpinionItem) => record?.opinion?.id ?? ""}
            dataSource={opinions.value}
            loading={opinions.loading}
        />


        <Modal title={`删除意见[${selectOpinionItem.current?.opinion?.activityName}]`}
            visible={deleteDlgVisual.value}
            onOk={onClickDelete}
            onCancel={deleteDlgVisual.Toggle}
            okText='确定删除'
            cancelText='取消'>
            <Alert
                message="确认删除如下意见吗？删除后不可恢复"
                description={selectOpinionItem.current?.opinion?.text}
                type="error"
                showIcon
            />
        </Modal>


        <MyDialog
            title={`修改意见[${selectOpinionItem.current?.opinion?.activityName}]`}
            open={visual.value}
            onClose={visual.Toggle}>
            <Form layout='vertical'>
                <Form.Item label="意见内容">
                    <TextArea value={selectOpinionText.value}
                        onChange={e => selectOpinionText.setValue(e.target.value)}></TextArea>
                </Form.Item>

                <Form.Item label="">
                    <Button onClick={onUpdateClick}>确定修改</Button>
                </Form.Item>
            </Form>
        </MyDialog>
    </>
}
