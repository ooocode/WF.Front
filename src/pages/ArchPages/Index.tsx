import { Button } from "antd"
import { navigate } from "gatsby-link"
import React, { useEffect, useState } from "react"
import { StringUtils } from "../../Commmon/consts"
import { useUser } from "../../hooks/useApi"
import ArchTodo from "./ArchTodo"
import Sumary from "./Sumary"




const Index = () => {
    /*useEffect(() => {
        navigate('/ArchPages/Index')
    }, [])*/

    const { userName, password } = useUser()

    useEffect(() => {
        if (!StringUtils.isNullOrEmpty(userName) && !StringUtils.isNullOrEmpty(password)) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://172.26.130.105/webmail', true, userName, password);
            xhr.withCredentials = true;
            xhr.send(null);
        }
    }, [userName, password])

    return <>
        <Sumary />
    </>
}

export default Index