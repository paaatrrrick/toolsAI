import { Controller, Post, Req, Res, Body, BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { InHouseService } from './inHouse.service';
import { EmailParamsDTO, CreateCsvDto, SmsDto } from './schemaValidators.dto';
import { ReadStream } from 'fs';
import * as fastcsv from 'fast-csv';
import { join } from 'path';
import { createReadStream, createWriteStream } from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs-extra';
import { Twilio } from 'twilio';





@Controller('in-house')
export class InHouseController {
    constructor(private readonly inHouseService: InHouseService) { }

    @Post('sendgmail')
    async default(@Req() request: Request, @Body() emailParams: EmailParamsDTO): Promise<any> {
        try {
            const data = await this.inHouseService.sendGmail(emailParams);
            console.log(data);
            return data;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('createcsv')
    async getCsv(@Body() createCsvDto: CreateCsvDto, @Res() res: Response): Promise<void> {
        // Generate CSV content based on fileInformation
        const { fileInformation, fileName } = createCsvDto;
        const csvContent = this.generateCsvContent(fileInformation);

        // Create a unique temporary CSV file
        const uniqueId = uuidv4();
        const filePath = join(`${process.cwd()}/src/inHouseAPIs/resources`, `temp-${uniqueId}.csv`);
        const writeStream = createWriteStream(filePath);
        // Write CSV content to the file
        const nameForFile = fileName ? fileName : 'tools-llm-generated';
        fastcsv
            .write(csvContent, { headers: true })
            .pipe(writeStream)
            .on('finish', async () => {
                // Create read stream for the CSV file
                const readStream: ReadStream = createReadStream(filePath);
                // Send CSV file to client
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename=${nameForFile}.csv`,
                );
                res.setHeader('Content-Type', 'text/csv');

                readStream.pipe(res).on('finish', () => {

                    // Delete the temporary file after sending the response
                    unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Failed to delete temporary file: ${filePath}`);
                        }
                    });
                });
            });
    }


    @Post('send-text')
    async sendSms(@Body() smsDto: SmsDto, @Res() res: Response): Promise<void> {
        const { accountSID, authToken, to, from, body } = smsDto;
        console.log(smsDto);

        // Initialize Twilio client
        const client = new Twilio(accountSID, authToken);

        try {
            // Send the message
            const message = await client.messages.create({ body, from, to });
            // Log the message SID and return success response
            console.log(message.sid);
            res.status(200).json({ message: 'Message sent successfully', sid: message.sid });
        } catch (error) {
            // Log the error and return error response
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Failed to send message', error: error.message });
        }
    }

    private generateCsvContent(fileInformation: string): any[] {
        // Split the input string into an array of lines
        const lines = fileInformation.split('\n');

        // Extract the header row and remove it from the lines array
        const headers = lines.shift().split(',');

        // Convert each line into an object based on the headers
        return lines.map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            return obj;
        });
    }
}

