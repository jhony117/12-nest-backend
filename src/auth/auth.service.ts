import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';

import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.patload';
import { LoginResponse } from './interfaces/login-response';

import {CreateUserDto, LoginDto, }from './dto'
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {


    constructor(
      @InjectModel( User.name ) 
      private userModel : Model<User>,
      private jwtService:JwtService,
      ) {}

  
  async create(createUserDto: CreateUserDto):Promise<User> {

  try{

    const {password, ...userData}= createUserDto;


    //?encriptamos la contraseña
    const newUser = new this.userModel({
      password : bcryptjs.hashSync(password, 10),
      ...userData
    })


    // 1 encriptar la contraseña

    // 2 : gurdal el usuario
  
    //generar el JWT   
     // const newUser = new this.userModel(CreateUserDto); 

    
    await newUser.save();

     //? hacemos que la contraseña no sea visible  
    const {password:_, ...user} = newUser.toJSON();
    return user; 


  } catch (error) {
      if(error.code === 11000){
        throw new BadRequestException(`${createUserDto.email} already exists`)
      }
      throw new InternalServerErrorException('somting terrible happen!!!');
  }
  }


 async login(loginDto:LoginDto):Promise<LoginResponse> {

  const {email, password} = loginDto;

  const user = await this.userModel.findOne({email}); 
  if (!user) {
    throw new  UnauthorizedException('Not calid credentias - email')
  }

  if(!bcryptjs.compareSync(password, user.password)){
    throw new UnauthorizedException('not valid credentias - password')

  }

  const { password:_, ...rest} = user.toJSON();
  return  {
 user :rest,
    token: this.getJwtToken({id : user.id}),
  }


   

 }
 
 async register(registerUserDto:RegisterUserDto) : Promise<LoginResponse> {
  
  const user = await this.create(registerUserDto);
      
 return {
 user: user,
 token: this.getJwtToken({id : user._id}),
  }

  }

  findAll() : Promise<User[]>{
    return this.userModel.find();
  }

  async findUserById( id : string ){
     const user = await this.userModel.findById(id);
    const {password, ...rest} = user.toJSON();
    return rest;
    }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken(payload : JwtPayload  ){
    const token = this.jwtService.sign(payload);
    return token ;

  }
}
