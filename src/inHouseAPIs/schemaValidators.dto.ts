// email-params.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailParamsDTO {
    @IsEmail()
    to: string;

    @IsNotEmpty()
    @IsString()
    subject: string;

    @IsNotEmpty()
    @IsString()
    body: string;

    @IsEmail()
    from: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}


export class CreateCsvDto {
    @IsNotEmpty()
    @IsString()
    fileInformation: string;

    @IsString()
    @IsOptional()
    fileName: string;
}

export class SmsDto {
    @IsNotEmpty()
    @IsString()
    accountSID: string;

    @IsNotEmpty()
    @IsString()
    authToken: string;

    @IsNotEmpty()
    @IsString()
    to: string;

    @IsNotEmpty()
    @IsString()
    from: string;

    @IsNotEmpty()
    @IsString()
    body: string;
}