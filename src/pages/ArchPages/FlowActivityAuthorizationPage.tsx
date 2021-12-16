import { Form } from "antd"
import React, { useEffect, useState } from "react"
import MainLayout from "../../components/MainLayout"
import { flowActivityAuthorizationsClient } from "../../hooks/useApi"
import { useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { TaskDelegate } from "../../WorkFlowApi"

const FlowActivityAuthorizationPage = () => {

    /* const [records, setRecords] = useState<TaskDelegate[]>([])
    const [users, setUsers] = useState<UserReply[]>([])


    useEffect(() => {
        document.title = '授权管理'

        let user = getCurUser()
        flowActivityAuthorizationsClient.getFlowActivityAuthorizations(user?.userName).then(res => {
            setRecords(res)
        }).catch(err => messageBox(err))

        var usersClient = new UsersClient(baseUrl)
    }, [])


    const showDlg = useToggle()

    return (<MainLayout>
        <Button onClick={showDlg.Toggle} variant='contained'>创建公文授权</Button>
        <List>
            {records.map(e => {
                return <ListItem key={e.userName}>
                    <ListItemText primary={''}></ListItemText>
                    <ListItemSecondaryAction>删除</ListItemSecondaryAction>
                </ListItem>
            })}
        </List>

        <MyDialog title="选择授权用户" open={showDlg.value} onClose={showDlg.Toggle}>
            <Form>
                <Form.Item label="选择用户" required>
                    <Select
                    >
                        {users.map(user => {
                            return <MenuItem key={user.id ?? ''} value={user.id ?? ''}>{user.name}</MenuItem>
                        })}
                    </Select>


                </Form.Item>

                <Form.Item label="授权开始时间">
                    <TextField
                        type="datetime-local"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Form.Item>

                <Form.Item label="授权结束时间">
                    <TextField
                        type="datetime-local"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Form.Item>

                <Form.Item label="">
                    <Button>确定创建</Button>
                </Form.Item>
            </Form>

        </MyDialog>
    </MainLayout>) */

    return <div></div>
}

export default FlowActivityAuthorizationPage