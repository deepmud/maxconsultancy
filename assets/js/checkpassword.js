// Loging page authentication(encryptions for password)
       function checkPassword(){
            var passw1 = document.getElementById('password1').value;
            var passw2 = document.getElementById('password2').value;

            var result = passw2 == passw1? true : false;
            if(!result){
                document.getElementById('password1').value =""
        document.getElementById('password2').value="";
                alert("Password does not match");
            }else{
                return;
            }
            
           
  
        }
 