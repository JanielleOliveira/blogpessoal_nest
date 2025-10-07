/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Testes dos Módulos Usuario e Auth (e2e)', () => {
  let token: any;
  let usuarioId: any;
  let temaId: any;
  let postagemId: any;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + './../src/**/entities/*.entity.ts'],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('01 - Deve Cadastrar um novo Usuário', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/usuarios/cadastrar')
      .send({
        nome: 'Root',
        usuario: 'root@root.com',
        senha: 'rootroot',
        foto: '-',
      })
      .expect(201);

    usuarioId = resposta.body.id;
  });

  it('02 - Não Deve Cadastrar um Usuário Duplicado', async () => {
    await request(app.getHttpServer())
      .post('/usuarios/cadastrar')
      .send({
        nome: 'Root',
        usuario: 'root@root.com',
        senha: 'rootroot',
        foto: '-',
      })
      .expect(400);
  });

  it('03 - Deve Autenticar o Usuário (Login)', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/usuarios/logar')
      .send({
        usuario: 'root@root.com',
        senha: 'rootroot',
      })
      .expect(200);

    token = resposta.body.token;
  });

  it('04 - Deve Listar todos os Usuários', async () => {
    return request(app.getHttpServer())
      .get('/usuarios/all')
      .set('Authorization', `${token}`)
      .send({})
      .expect(200);
  });

  it('05 - Deve Atualizar um Usuário', async () => {
    return request(app.getHttpServer())
      .put('/usuarios/atualizar')
      .set('Authorization', `${token}`)
      .send({
        id: usuarioId,
        nome: 'Root Atualizado',
        usuario: 'root@root.com',
        senha: 'rootroot',
        foto: '-',
      })
      .expect(200)
      .then((resposta) => {
        expect('Root Atualizado').toEqual(resposta.body.nome);
      });
  });
  it('06 - Deve conseguir criar Tema', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/temas')
      .set('Authorization', `${token}`)
      .send({
        descricao: 'Novo Tema',
      })
      .expect(201);
    temaId = resposta.body.id;
  });

  it('06.2 - Não deve conseguir criar uma tema sem o token de usuário', async () => {
    await request(app.getHttpServer())
      .post('/temas')
      .send({
        descricao: 'Novo Tema',
      })
      .expect(401);
  });

  it('06.3 - Deve conseguir atualizar Tema', async () => {
    return request(app.getHttpServer())
      .put('/temas')
      .set('Authorization', `${token}`)
      .send({
        id: temaId,
        descricao: 'Tema Atualizado',
      })
      .expect(200)
      .then((resposta) => {
        expect(resposta.body.descricao).toEqual('Tema Atualizado');
      });
  });

  it('06.4 - Deve conseguir listar todos os Temas', async () => {
    return request(app.getHttpServer())
      .get('/temas')
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('06.5 - Deve consultar uma Tema por ID', async () => {
    return request(app.getHttpServer())
      .get(`/temas/${temaId}`)
      .set('Authorization', `${token}`)
      .expect(200)
      .then((resposta) => {
        expect(resposta.body.id).toEqual(temaId);
      });
  });

  it('07 - Deve cadastrar uma nova Postagem', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/postagens')
      .set('Authorization', `${token}`)
      .send({
        titulo: 'Postagem 03',
        texto: 'Texto da Postagem 03',
        tema: { id: temaId },
        usuario: { id: usuarioId },
      })
      .expect(201);

    postagemId = resposta.body.id;
  });

  it('07.1 - Não deve cadastrar uma Postagem sem o token do usuário', async () => {
    await request(app.getHttpServer())
      .post('/postagens')
      .send({
        titulo: 'Postagem sem token',
        texto: 'Conteúdo sem autorização',
        tema: { id: temaId },
        usuario: { id: usuarioId },
      })
      .expect(401);
  });

  it('07.2 - Deve listar todas as Postagens', async () => {
    return request(app.getHttpServer())
      .get('/postagens')
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('07.3 - Deve consultar uma Postagem por ID', async () => {
    return request(app.getHttpServer())
      .get(`/postagens/${postagemId}`)
      .set('Authorization', `${token}`)
      .expect(200)
      .then((resposta) => {
        expect(resposta.body.id).toEqual(postagemId);
      });
  });

  it('07.4 - Deve consultar Postagem por Título', async () => {
    return request(app.getHttpServer())
      .get('/postagens/titulo/Postagem')
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('07.5 - Deve atualizar uma Postagem', async () => {
    return request(app.getHttpServer())
      .put('/postagens')
      .set('Authorization', `${token}`)
      .send({
        id: postagemId,
        titulo: 'Postagem Atualizada',
        texto: 'Texto atualizado da Postagem',
        tema: { id: temaId },
        usuario: { id: usuarioId },
      })
      .expect(200)
      .then((resposta) => {
        expect('Postagem Atualizada').toEqual(resposta.body.titulo);
      });
  });
});
