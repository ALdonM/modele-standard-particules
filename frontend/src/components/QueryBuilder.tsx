import React, { useState } from 'react';
import { FilterCriterion, FieldConfig } from '../types';
import { useLang } from '../i18n';

interface Props {
  fields: FieldConfig[];
  onSearch: (criteria: FilterCriterion[], logic: ('ET' | 'OU')[]) => void;
}

const OPERATORS: Record<string, string[]> = {
  text: ['=', '!=', 'LIKE', 'IS NULL'],
  number: ['=', '!=', '<', '>', '<=', '>=', 'BETWEEN', 'IS NULL'],
  select: ['=', '!=', 'IS NULL'],
  boolean: ['=', 'IS NULL'],
  date: ['=', '!=', '<', '>', 'BETWEEN', 'IS NULL']
};

const QueryBuilder: React.FC<Props> = ({ fields, onSearch }) => {
  const { t } = useLang();
  const [criteria, setCriteria] = useState<FilterCriterion[]>([
    { id: 1, field: fields[0]?.name || '', operator: '=', value: '' }
  ]);
  const [logic, setLogic] = useState<('ET' | 'OU')[]>([]);

  const addCriterion = () => {
    const newId = criteria.length > 0 ? Math.max(...criteria.map(c => c.id)) + 1 : 1;
    setCriteria([...criteria, { id: newId, field: fields[0]?.name || '', operator: '=', value: '' }]);
    setLogic([...logic, 'ET']);
  };

  const removeCriterion = (id: number) => {
    const idx = criteria.findIndex(c => c.id === id);
    const newCriteria = criteria.filter(c => c.id !== id);
    const newLogic = logic.filter((_, i) => i !== idx - 1);
    setCriteria(newCriteria);
    setLogic(newLogic);
  };

  const updateCriterion = (id: number, updates: Partial<FilterCriterion>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const getFieldType = (fieldName: string): string => {
    return fields.find(f => f.name === fieldName)?.type || 'text';
  };

  const getFieldOptions = (fieldName: string) => {
    return fields.find(f => f.name === fieldName)?.options || [];
  };

  const handleSearch = () => {
    onSearch(criteria, logic);
  };

  const handleReset = () => {
    setCriteria([{ id: 1, field: fields[0]?.name || '', operator: '=', value: '' }]);
    setLogic([]);
    onSearch([], []);
  };

  return (
    <div className="query-builder">
      <h4>{t('🔍 Critères de sélection')}</h4>
      
      {criteria.map((criterion, index) => {
        const fieldType = getFieldType(criterion.field);
        const operators = OPERATORS[fieldType] || ['='];
        const options = getFieldOptions(criterion.field);
        const isBetween = criterion.operator === 'BETWEEN';
        const isNull = criterion.operator === 'IS NULL';

        return (
          <div key={criterion.id} className="criterion-row">
            {index > 0 && (
              <select 
                className="logic-select"
                value={logic[index - 1] || 'ET'}
                onChange={(e) => {
                  const newLogic = [...logic];
                  newLogic[index - 1] = e.target.value as 'ET' | 'OU';
                  setLogic(newLogic);
                }}
              >
                <option value="ET">{t('ET')}</option>
                <option value="OU">{t('OU')}</option>
              </select>
            )}

            <select
              value={criterion.field}
              onChange={(e) => updateCriterion(criterion.id, { 
                field: e.target.value, 
                operator: '=',
                value: '',
                value2: undefined 
              })}
            >
              {fields.map(f => (
                <option key={f.name} value={f.name}>{t(f.label)}</option>
              ))}
            </select>

            <select
              value={criterion.operator}
              onChange={(e) => updateCriterion(criterion.id, { 
                operator: e.target.value,
                value: e.target.value === 'IS NULL' ? null : '',
                value2: undefined
              })}
            >
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            {!isNull && (
              <>
                {options.length > 0 ? (
                  <select
                    value={criterion.value as string || ''}
                    onChange={(e) => {
                      const val = fieldType === 'number' || fieldType === 'select' 
                        ? parseFloat(e.target.value) 
                        : e.target.value;
                      updateCriterion(criterion.id, { value: val });
                    }}
                  >
                    <option value="">{t('-- Choisir --')}</option>
                    {options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : fieldType === 'boolean' ? (
                  <select
                    value={criterion.value === true ? 'true' : criterion.value === false ? 'false' : ''}
                    onChange={(e) => updateCriterion(criterion.id, { 
                      value: e.target.value === 'true' 
                    })}
                  >
                    <option value="">{t('-- Choisir --')}</option>
                    <option value="true">{t('Oui')}</option>
                    <option value="false">{t('Non')}</option>
                  </select>
                ) : (
                  <input
                    type={fieldType === 'number' ? 'number' : 'text'}
                    value={(criterion.value as string) || ''}
                    onChange={(e) => updateCriterion(criterion.id, { 
                      value: fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                    })}
                    placeholder={t('Valeur...')}
                    step={fieldType === 'number' ? 'any' : undefined}
                  />
                )}

                {isBetween && (
                  <input
                    type={fieldType === 'number' ? 'number' : 'text'}
                    value={(criterion.value2 as string) || ''}
                    onChange={(e) => updateCriterion(criterion.id, { 
                      value2: fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                    })}
                    placeholder={t('Valeur 2...')}
                    step="any"
                  />
                )}
              </>
            )}

            {criteria.length > 1 && (
              <button 
                className="btn-remove"
                onClick={() => removeCriterion(criterion.id)}
                title={t('Supprimer ce critère')}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      <div className="query-actions">
        <button className="btn btn-add" onClick={addCriterion}>{t('+ Ajouter un critère')}</button>
        <button className="btn btn-primary" onClick={handleSearch}>{t('🔍 Rechercher')}</button>
        <button className="btn btn-secondary" onClick={handleReset}>{t('↺ Réinitialiser')}</button>
      </div>
    </div>
  );
};

export default QueryBuilder;
