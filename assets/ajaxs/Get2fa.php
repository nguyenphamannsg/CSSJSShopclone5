<?php 
    require_once("../../config/config.php");
    require_once("../../config/function.php");
    require_once("../../class/GoogleAuthenticator.php");

    if (isset($_POST['key']))
    {
        $key = trim($_POST['key']);
        if(empty($key))
        {
            msg_error2("Vui lòng nhập Secret Key");
        }
        $ga = new PHPGangsta_GoogleAuthenticator();
        $code = $ga->getCode($key);
        msg_success2($code);
    }
