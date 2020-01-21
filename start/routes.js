'use strict'
/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

var knex = require('knex')({
  client: 'mysql',
  version: '5.6',
  connection: {
    host: 'db4free.net',
    port: '3306',
    user:'gdocuments',
    password: 'ouJmFfBnrkLObW3a',
    database: 'gdocuments'
  }

});

/*===================================================== */
Route.on('/').render('welcome')

Route.get('/test/', () => 'HI' )

/* HOME===================================================== */
Route.get('/home', async ({request, params}) => {
  return await knex.select().table('usuario')
})

/* LOGIN ===================================================== */
Route.get('/user/:mail/:password', async ({request, params}) => {
  //console.log(params);
  return await knex.where({
    correo: params.mail,
    contraseña:  params.password
  }).select().table('usuario')

}).formats(['json'])

/* DATOS CARGADOS AL INICIAR SESION===================================================== */
Route.get('/user/:mail', async ({request, params}) => {
  //console.log(params);

  var usuario = await knex.where({
    correo: params.mail
  })
  .select('idUsuario','correo','username','admin','Organizacion_idOrganizacion','permisos','Usuario_detalle_idUsuario')
  .table('usuario')

  var org = await knex.where({
    idOrganizacion: usuario[0]["Organizacion_idOrganizacion"]
  })
  .select('nombre','estado','Estructura_idEstructura')
  .table('organizacion')

  var usuario_detalle = await knex.where({
    idUsuario: usuario[0]["Usuario_detalle_idUsuario"]
  })
  .select('nombre','apellido','num_empleado')
  .table('usuario_detalle')

  return  [usuario, org, usuario_detalle]

}).formats(['json'])

/* VISTA GESTION DE USUARIOS ===================================================== */
Route.get('/users/:id', async ({request, params}) => {
  //console.log(params);

  return await knex('usuario')
  .innerJoin('usuario_detalle', function() {
    this.on('usuario.Usuario_detalle_idUsuario', '=', 'usuario_detalle.idUsuario')
  })
  .where({Organizacion_idOrganizacion: params.id})
  .select('usuario.idUsuario','correo','admin','estado','permisos','Usuario_detalle_idUsuario','nombre','apellido')

}).formats(['json'])

/* EDITAR INFORMACION DEL USUARIO ===================================================== */
Route.get('/edit_user/', async ({request}) => {    
  var params=request.get();

  knex('usuario')
  .where('idUsuario', '=', params.id)
  .update({
    correo: params.mail
  })
  
  var usuario = await knex.where({
    idUsuario: params.id
  })
  .select('Usuario_detalle_idUsuario')
  .table('usuario')

  //console.log(usuario[0]["Usuario_detalle_idUsuario"]);

  return await knex('usuario_detalle')
  .where('idUsuario', '=', usuario[0]["Usuario_detalle_idUsuario"])
  .update({
    num_empleado: params.num,
    nombre: params.name,
    apellido: params.lastname
  })

}).formats(['json'])

/* CONFIGURACION INICIAL DEL SISTEMA ADMINISTRADOR ===================================================== */
Route.get('/user-information/', async ({request}) => {    
  var params=request.get();
  //console.log(params);

  var idUsuario = await knex
  .table('usuario_detalle')
  .insert({
    num_empleado: params.num,
    nombre:  params.name,
    apellido: params.lastname,
    idUsuarioCreacion: ''
  })
  .returning('idUsuario')

  var department = await knex
  .table('organizacion')
  .insert({
    Estructura_idEstructura: params.numE,
    nombre:  params.nameE
  })
  .returning('idOrganizacion')

  //console.log(idUsuario+" "+department);
  return await knex('usuario')
  .where({correo: params.mail})
  .update({
    Usuario_detalle_idUsuario: idUsuario,
    Organizacion_idOrganizacion: department
  })

}).formats(['json'])

/* CONFIGURACION INICIAL DEL SISTEMA USUARIO ===================================================== */
Route.get('/user/', async ({request}) => {
  var params=request.get();    
  //console.log(params);

  var idUsuario = await knex
  .table('usuario_detalle')
  .insert({
    num_empleado: params.num,
    nombre:  params.name,
    apellido: params.lastname,
    idUsuarioCreacion: ''
  })
  .returning('idUsuario')

  return await knex('usuario')
  .where({correo: params.mail})
  .update({
    Usuario_detalle_idUsuario: idUsuario
  })

}).formats(['json'])

/* FILTROS ===================================================== */
Route.get('/filter/:type/:year/:month/:cat/', async ({request, params}) => {    
  //console.log(params);
  var usuario = await knex.where({
    idUsuario: params.id
  })
  .table('correspondenciarecibida')

  return usuario

}).formats(['json'])

/* VISTA GESTION DE DOCUMENTOS===================================================== */
Route.get('/documents/:id/', async ({request, params}) => {    
  //console.log(params);

  var state = await knex.where({
    idOrganizacion: params.id
  })
  .select('estado')
  .table('organizacion')

  var documents;

  if(state[0]["estado"][0]==0){
    documents = await knex.where({
      global: 0
    })
    .table('tipodedocumento')

  }else{
    documents = await knex('referencia')
    .innerJoin('tipodedocumento', function() {
      this.on('TipoDeDocumento_idTipoDeDocumento', '=', 'idTipoDeDocumento')
    })
    .where({Organizacion_idOrganizacion: params.id})
  } 
  return {"estado": state[0]["estado"][0], "data": documents}

}).formats(['json'])

/* ===================================================== */
Route.get('/documents2/:id/', async ({request, params}) => {    
  
  var state = await knex.where({
    idOrganizacion: params.id
  })
  .select('estado')
  .table('organizacion')

  //console.log(params);
  //console.log(state[0]["estado"][0]);
  return state[0]["estado"]["data"]

}).formats(['json'])

/* CREAR NUEVO DOCUMENTO===================================================== */
Route.get('/newDocument/', async ({request}) => {
  var params=request.get();   
  //console.log(params);

  return await knex
  .table('referencia')
  .insert({
    referencia: params.ref,
    Organizacion_idOrganizacion:  params.org,
    TipoDeDocumento_idTipoDeDocumento: params.type,
    Usuario_idUsuario: params.idUser
  })

}).formats(['json'])

/* CREAR NUEVO USUARIO===================================================== */
Route.get('/addUser/', async ({request}) => {
  var params=request.get();   
  //console.log(params);
  var pass = Math.random().toString(36).substr(2);

  var enc = require("crypto-js/sha1");
  var epass = enc(pass)+"";
  var result = await knex
  .table('usuario')
  .insert({
    correo: params.mail,
    Organizacion_idOrganizacion:  params.org,
    contraseña: epass
  })

  return {result, pass}

}).formats(['json'])

/* ACTIVAR ORGANIZACION AL FINALIZAR LA CONFIGURACION===================================================== */
Route.get('/active/:org/', async ({request, params}) => {    
  //console.log(params);

  return await knex('organizacion')
  .where({idOrganizacion: params.org})
  .update({
    estado: 1
  })

}).formats(['json'])

/* EDITAR LA REFERENCIA DE UN DOCUMENTO===================================================== */
Route.get('/editDocument/', async ({request}) => {    
  var params=request.get();
  //console.log(params);

  return await knex('referencia')
  .where({idReferencia: params.idRef})
  .update({
    referencia: params.ref
  })

}).formats(['json'])

/* DAR DE BAJA, BLOQUEAR O REACTIVAR USUARIO===================================================== */
Route.get('/user_state/', async ({request}) => {    
  var params=request.get();

  if(params.state=='true'){
    var st = await knex('usuario')
    .where({idUsuario: params.userid})
    .update({
      estado: 0
    })
  }else{
    var st = await knex('usuario')
    .where({idUsuario: params.userid})
    .update({
      estado: 1
    })
  }
  return st;

}).formats(['json'])

/* TIPOS DE DOCUMENTOS===================================================== */
Route.get('/typeDocuments/:id/', async ({request, params}) => {    
  //console.log(params);

  return await knex('referencia')
    .innerJoin('tipodedocumento', function() {
      this.on('TipoDeDocumento_idTipoDeDocumento', '=', 'idTipoDeDocumento')
    })
    .where({Organizacion_idOrganizacion: params.id})
    .select('idTipoDeDocumento','nombre')

}).formats(['json'])

/* TIPOS DE DOCUMENTOS SIN REFERENCIA===================================================== */
Route.get('/typeDocuments2/:id/', async ({request, params}) => {    
  //console.log(params);

  return await knex('tipodedocumento')
    .leftJoin('referencia', function() {
      this.on('TipoDeDocumento_idTipoDeDocumento', '=', 'idTipoDeDocumento')
    })
    .whereIn('global', [0, params.id])
    .whereNull('idReferencia')
    .select('idTipoDeDocumento','nombre','idReferencia')

}).formats(['json'])

/* CREAR NUEVO TIPO DE DOCUMENTO===================================================== */
Route.get('/newTypeDocument/', async ({request}) => {    
  var params=request.get();
  //console.log(params);

  return await knex
  .table('tipodedocumento')
  .insert({
    nombre: params.ref,
    global: params.org
  })

}).formats(['json'])

/* EDITAR NOMBRE DE LA ORGANIZACION===================================================== */
Route.get('/name_department/', async ({request}) => {  
  var params=request.get();  
  //console.log(params);

  return await knex('organizacion')
  .where({idOrganizacion: params.org})
  .update({
    nombre: params.name
  })

}).formats(['json'])

/* CREAR NUEVA CORRESPONDENCIA===================================================== */
Route.get('/newCorrespondenceE/', async ({request}) => {    
  var info=request.get();
  //console.log(info);

  var ref = 0; 
  var documents = await knex('referencia')
  .innerJoin('tipodedocumento', function() {
    this.on('TipoDeDocumento_idTipoDeDocumento', '=', 'idTipoDeDocumento')
  })
  .where({Organizacion_idOrganizacion: info.org,
    TipoDeDocumento_idTipoDeDocumento: info.type})
  .returning('idReferencia')

  //console.log(documents.length+";;"+documents);

  if(documents.length==0){
    return {error: "El Administrador no ha creado la referencia para este documento"};
  }else{
    var fecha = new Date();
    var anio = fecha.getFullYear();

    var correlativo = await knex('correlativo')
    .where({
      Referencia_idReferencia: documents[0]['idReferencia'],
      año: anio
    }).select()

    if(correlativo.length==0){
      ref = await knex
      .table('correlativo')
      .insert({
        año: anio,
        correlativo:  1,
        Referencia_idReferencia: documents[0]['idReferencia']
      })
      .returning('correlativo')
      //console.log("Agregar correlativo a la tabla");  
    
      var rel = await corr_e(1, documents[0]['idReferencia'], info, fecha);

      return {nombre: documents[0].nombre,referencia: documents[0].referencia,año: anio,ref: 1,status: rel, date: fecha};

    }else{
      //console.log("correlativo ya existe");
      ref = await knex('correlativo')
        .where('idCorrelativo', '=', correlativo[0]["idCorrelativo"])
        .update({
          correlativo: correlativo[0]["correlativo"]+1
        })
      .select('correlativo')

      if(ref==1){
        ref=correlativo[0]["correlativo"]+1;
        var rel = await corr_e(correlativo[0]["correlativo"]+1, documents[0]['idReferencia'], info, fecha);
        return {nombre: documents[0].nombre,referencia: documents[0].referencia,año: correlativo[0].año, ref,status: rel, date: fecha};
      }
    }

    }

  return ref;

}).formats(['json'])

/* ===================================================== */
Route.get('/newCorrespondenceEX/:org/:type/', async ({request, params}) => {
  var ref = 0; 
  var documents = await knex('referencia')
    .innerJoin('tipodedocumento', function() {
      this.on('TipoDeDocumento_idTipoDeDocumento', '=', 'idTipoDeDocumento')
    })
    .where({Organizacion_idOrganizacion: params.org,
      TipoDeDocumento_idTipoDeDocumento: params.type})
      .returning('idReferencia')

      //console.log(documents.length+";;"+documents);

      if(documents.length==0){
        return {error: "El Administrador no ha creado la referencia para este documento"};
      }else{
        var fecha = new Date();
        var anio = fecha.getFullYear();
        var correlativo = await knex('correlativo')
        .where({
        Referencia_idReferencia: documents[0]['idReferencia'],
        año: anio
       }).select()

       if(correlativo.length==0){
        ref = await knex
        .table('correlativo')
        .insert({
          año: anio,
          correlativo:  1,
          Referencia_idReferencia: documents[0]['idReferencia']
        })
        .returning('correlativo')
         //console.log("Agregar correlativo a la tabla");
         return {nombre: documents[0].nombre,referencia: documents[0].referencia,año: anio,ref: 1};
       }else{
         //console.log("correlativo ya existe");
        ref = await knex('correlativo')
        .where('idCorrelativo', '=', correlativo[0]["idCorrelativo"])
        .update({
          correlativo: correlativo[0]["correlativo"]+1
        })
        .select('correlativo')

        if(ref==1){
          ref=correlativo[0]["correlativo"]+1;
          return {nombre: documents[0].nombre,referencia: documents[0].referencia,año: correlativo[0].año, ref};
        }
       }
     }

     return ref;

}).formats(['json'])

/* ===================================================== */
async function  corr_e(correlativo, ref, info, fecha) {
  var data = eval('('+info.data+')');
  var c_detalle = await knex
        .table('correspondenciaenviada_detalle')
        .insert({
          anexo: 	data.attach,
          copia: 	data.copy,
          num_paginas: data.num_pages,
          obs_anexo: data.obs_attach,
          observaciones: data.obs
        })
        .returning('idCorrespondenciaEnviada')
        //console.log(c_detalle);

        var corr = await knex
        .table('correspondenciaenviada')
        .insert({
          destinatario: data.dest_rem,
          asunto: data.affair,
          fecha_envio: fecha,
          correlativo: correlativo,
          destino: data.dest_proc,
          CorrespondenciaEnviada_detalle_idCorrespondenciaEnviada: c_detalle,
          Referencia_idReferencia: ref,
          idUsuario: info.userid
        })
        .returning('idCorrespondenciaEnviada')
        //console.log(info);
        //console.log(corr);

        /*var rel = await knex
        .table('correspondenciaenviada_usuario')
        .insert({
          CorrespondenciaEnviada_idCorrespondenciaEnviada: corr,
          Usuario_idUsuario: info.userid
        })
        //console.log(rel);
        */
        //console.log(data);
        return corr;
}

/* FILTRO TODOS===================================================== */
Route.get('/corr_e/', async ({request}) => {
  var params=request.get();  
  //console.log(params);
  var result;
  if(params.tag==2){
    result= await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id, idUsuario: params.userid})
  }else{
    result = await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id})
  }
  //console.log(result);
  return result;
})

/* FILTRO RECIENTES===================================================== */
Route.get('/corr_e/recientes/', async ({request}) => {
  var params=request.get();  
  //console.log(params);
  var fecha = new Date();
  var fecha_min=new Date(fecha.getFullYear(), fecha.getMonth(),0);
  var fecha_max=new Date(fecha.getFullYear(), fecha.getMonth(),31);

  if(params.tag==2){
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id, idUsuario: params.userid})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])

  }else{
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
  }
  
})

Route.get('/corr_e/year/', async ({request}) => {
  var params=request.get();  
  //console.log(params);
  var fecha = new Date();
  var fecha_min=new Date(params.year, 0,0);
  var fecha_max=new Date(params.year, 11,31);

  if(params.tag==2){
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id, idUsuario: params.userid})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
  
  }else{
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
  }
  
})

Route.get('/corr_e/month/', async ({request}) => {
  var params=request.get();  
  //console.log(params);
  var fecha = new Date();
  var fecha_min=new Date(fecha.getFullYear(), params.month,0);
  var fecha_max=new Date(fecha.getFullYear(), params.month,31);

  return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id, idUsuario: params.userid})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
})

Route.get('/corr_e/year_month/', async ({request}) => {
  var params=request.get();  
  //console.log(params);
  var fecha = new Date();
  var fecha_min=new Date(params.year, params.month,0);
  var fecha_max=new Date(params.year, params.month,31);

  if(params.tag==2){
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id , idUsuario: params.userid})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
  }else{
    return await knex('correspondenciaenviada')
  .innerJoin('referencia', function() {
    this.on('Referencia_idReferencia', '=', 'idReferencia')
  })
  .where({Organizacion_idOrganizacion: params.id})
  .whereBetween('fecha_envio', [fecha_min, fecha_max])
  }
  
})

/* DOCUMENT INFO===================================================== */
Route.get('/documentInfo2/', async ({request, params}) => {
  var params=request.get();
  //console.log(params);
  return await knex('correspondenciaenviada_detalle')
  .where({idCorrespondenciaEnviada: params.idDocument})
  .select()
  
}).formats(['json'])

/* DOCUMENT INFO===================================================== */
Route.get('/documentInfo/', async ({request}) => {
  var params=request.get();
  //console.log(params);
  var info = await knex('correspondenciaenviada_detalle')
  .where({idCorrespondenciaEnviada: params.idDocument})
  .select()

  var usuario = await knex.where({
    idUsuario: params.userid
  })
  .select('Usuario_detalle_idUsuario')
  .table('usuario')

  var usuario_detalle = await knex.where({
    idUsuario: usuario[0]["Usuario_detalle_idUsuario"]
  })
  .select('nombre','apellido','num_empleado')
  .table('usuario_detalle')

  var usuario_detalle1=null;
  var usuario2=null;
  if(info[0].idUserRemision!=null){
    usuario2 = await knex.where({
      idUsuario: info[0].idUserRemision
    })
    .select('Usuario_detalle_idUsuario')
    .table('usuario')

    usuario_detalle1 = await knex.where({
      idUsuario: usuario2[0]["Usuario_detalle_idUsuario"]
    })
    .select('nombre','apellido','num_empleado')
    .table('usuario_detalle')
  }

  var usuario_detalle2=null;

  if(info[0].idUserRecibido!=null){
    usuario2 = await knex.where({
      idUsuario: info[0].idUserRecibido
    })
    .select('Usuario_detalle_idUsuario')
    .table('usuario')

    usuario_detalle2 = await knex.where({
      idUsuario: usuario2[0]["Usuario_detalle_idUsuario"]
    })
    .select('nombre','apellido','num_empleado')
    .table('usuario_detalle')
  }

  var usuario_detalle3=null;


  if(info[0].idUserEscaneo!=null){
    usuario2 = await knex.where({
      idUsuario: info[0].idUserEscaneo
    })
    .select('Usuario_detalle_idUsuario')
    .table('usuario')

    usuario_detalle3 = await knex.where({
      idUsuario: usuario2[0]["Usuario_detalle_idUsuario"]
    })
    .select('nombre','apellido','num_empleado')
    .table('usuario_detalle')
  }
  
  return {info, usuario_detalle, usuario_detalle1, usuario_detalle2, usuario_detalle3}
  
}).formats(['json'])

/* USER INFO===================================================== */
Route.get('/userInfo/', async ({request}) => {
  var params=request.get();
  //console.log(params);
  var usuario = await knex.where({
    idUsuario: params.userid
  })
  .select('Usuario_detalle_idUsuario')
  .table('usuario')

  var usuario_detalle = await knex.where({
    idUsuario: usuario[0]["Usuario_detalle_idUsuario"]
  })
  .select('nombre','apellido','num_empleado')
  .table('usuario_detalle')

  return  [usuario_detalle]
  
}).formats(['json'])

/* CAMBIAR PASSWORD===================================================== */
Route.get('/password/', async ({request}) => {
  var params=request.get();
  //console.log(params);

  var pass = await knex('usuario')
  .where({idUsuario: params.id})
  .select('contraseña')
  
  var ref=null;
  if(pass[0].contraseña==params.last_password){
    var ref = await knex('usuario')
    .where('idUsuario', '=', params.id)
    .update({
      contraseña: params.new_password
    })
  }else{
    ref=0;
  }
  
  return ref;
}).formats(['json'])

Route.get('/tracing/', async ({request}) => {    
  var params=request.get();
  //console.log(params);
  var result=[];

  if(params.case==1){
    result = await knex
  .table('correspondenciaenviada_detalle')
  .where('idCorrespondenciaEnviada', '=', params.idDoc)
  .update({
    fecha_remision: params.date,
    idUserRemision: params.userid
  })

  }else if(params.case==2){
    result = await knex
  .table('correspondenciaenviada_detalle')
  .where('idCorrespondenciaEnviada', '=', params.idDoc)
  .update({
    fecha_recepcion: params.date,
    idUserRecibido: params.userid
  })

  }else if(params.case==3){
    result = await knex
  .table('correspondenciaenviada_detalle')
  .where('idCorrespondenciaEnviada', '=', params.idDoc)
  .update({
    fecha_escaneo: params.date,
    idUserEscaneo: params.userid
  })
  }
  return result;
}).formats(['json'])