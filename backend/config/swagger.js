import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DataGuardian API',
            version: '1.0.0',
            description: 'API documentation for DataGuardian - A sophisticated privacy protection and tracker analysis engine.',
            contact: {
                name: 'DataGuardian Support',
            },
        },
        servers: [
            {
                url: process.env.BACKEND_URL || 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                AnalysisResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        url: { type: 'string' },
                        trackerCount: { type: 'integer' },
                        detectedTrackers: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        aiSummary: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js', './controllers/*.js'], // files containing annotations as above
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "DataGuardian API Documentation"
    }));
    console.log('Swagger UI available at /api-docs');
};
